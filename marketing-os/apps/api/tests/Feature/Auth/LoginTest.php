<?php

namespace Tests\Feature\Auth;

use App\Domain\Identity\Models\LoginActivity;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_success_records_activity_and_audit(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        $this->postJson('/api/v1/auth/login', ['email' => 'A@Example.com', 'password' => 'correct-horse-battery-9'])
            ->assertOk()->assertJsonPath('data.id', $user->id);

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh()->last_login_at);
        $this->assertDatabaseHas('login_activities', ['user_id' => $user->id, 'outcome' => 'success']);
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.login', 'actor_id' => $user->id]);
    }

    public function test_wrong_password_and_unknown_email_look_identical(): void
    {
        $this->user(['email' => 'a@example.com']);
        $wrong = $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'nope-nope-nope-1']);
        $unknown = $this->postJson('/api/v1/auth/login', ['email' => 'ghost@example.com', 'password' => 'nope-nope-nope-1']);

        $wrong->assertStatus(422)->assertJsonPath('code', 'invalid_credentials');
        $unknown->assertStatus(422)->assertJsonPath('code', 'invalid_credentials');
        $this->assertSame($wrong->json('errors'), $unknown->json('errors'));
        $this->assertGuest();
        $this->assertSame(2, LoginActivity::where('outcome', 'failed')->count());
    }

    public function test_lockout_after_five_failures_even_with_correct_password(): void
    {
        $this->user(['email' => 'a@example.com']);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'wrong-wrong-1234'])->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'correct-horse-battery-9'])
            ->assertStatus(429)->assertJsonPath('code', 'login_locked')->assertJsonStructure(['retry_after']);
        $this->assertGuest();
        $this->assertDatabaseHas('login_activities', ['outcome' => 'locked']);
    }

    public function test_distributed_guessing_against_one_account_is_throttled_across_ips(): void
    {
        $this->user(['email' => 'a@example.com']);
        for ($i = 1; $i <= 25; $i++) {
            $this->withServerVariables(['REMOTE_ADDR' => "203.0.113.$i"])
                ->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'wrong-wrong-1234'])->assertStatus(422);
        }
        $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.9'])
            ->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'correct-horse-battery-9'])
            ->assertStatus(429)->assertJsonPath('code', 'login_locked');
    }

    public function test_logout_invalidates_session(): void
    {
        $user = $this->user();
        $this->actingAs($user)->postJson('/api/v1/auth/logout')->assertNoContent();
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.logout', 'actor_id' => $user->id]);
        $this->assertGuest();
    }

    public function test_protected_routes_return_problem_details_401(): void
    {
        $this->getJson('/api/v1/me')->assertUnauthorized()
            ->assertJsonPath('code', 'unauthenticated')->assertJsonPath('status', 401)
            ->assertHeader('Content-Type', 'application/problem+json')->assertHeader('X-Request-Id');
    }

    public function test_forgot_password_never_reveals_whether_an_account_exists(): void
    {
        Notification::fake();
        $user = $this->user(['email' => 'a@example.com']);
        $known = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'a@example.com']);
        $unknown = $this->postJson('/api/v1/auth/forgot-password', ['email' => 'ghost@example.com']);

        $known->assertStatus(202);
        $unknown->assertStatus(202);
        $this->assertSame($known->json(), $unknown->json());
        Notification::assertSentTo($user, ResetPassword::class);
        Notification::assertCount(1);
    }

    public function test_reset_password_changes_password_signs_out_everywhere_and_rejects_reuse(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        DB::table('sessions')->insert(['id' => 'sess1', 'user_id' => $user->id, 'payload' => 'x', 'last_activity' => time()]);
        $token = Password::createToken($user);
        $body = ['token' => $token, 'email' => 'a@example.com', 'password' => 'brand-new-pass-77', 'password_confirmation' => 'brand-new-pass-77'];

        $this->postJson('/api/v1/auth/reset-password', $body)->assertOk();
        $this->assertTrue(password_verify('brand-new-pass-77', $user->fresh()->password));
        $this->assertSame(0, DB::table('sessions')->where('user_id', $user->id)->count());
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.password_reset', 'actor_id' => $user->id]);

        $this->postJson('/api/v1/auth/reset-password', $body)->assertStatus(422)->assertJsonPath('code', 'invalid_reset_token');
    }

    public function test_reset_link_points_to_the_frontend(): void
    {
        Notification::fake();
        $user = $this->user();
        $this->postJson('/api/v1/auth/forgot-password', ['email' => $user->email])->assertStatus(202);
        Notification::assertSentTo($user, ResetPassword::class, function ($n) use ($user) {
            $url = ResetPassword::$createUrlCallback ? (ResetPassword::$createUrlCallback)($user, $n->token) : '';

            return str_starts_with($url, config('marketing.frontend_url').'/reset-password?token=');
        });
    }
}
