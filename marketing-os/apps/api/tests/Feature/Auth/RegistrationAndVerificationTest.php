<?php

namespace Tests\Feature\Auth;

use App\Domain\Identity\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class RegistrationAndVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $over = []): array
    {
        return $over + ['name' => 'Sara Ali', 'email' => 'Sara@Example.com', 'password' => 'correct-horse-9', 'password_confirmation' => 'correct-horse-9'];
    }

    public function test_register_creates_user_logs_in_and_sends_verification(): void
    {
        Notification::fake();
        $res = $this->postJson('/api/v1/auth/register', $this->payload());

        $res->assertCreated()->assertJsonPath('data.email', 'sara@example.com')->assertJsonPath('data.email_verified', false);
        $user = User::firstWhere('email', 'sara@example.com');
        $this->assertNotNull($user);
        $this->assertTrue(password_verify('correct-horse-9', $user->password));
        $this->assertNotSame('correct-horse-9', $user->password);
        Notification::assertSentTo($user, VerifyEmail::class);
        $this->assertAuthenticatedAs($user);
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.registered', 'actor_id' => $user->id]);
        $this->app['auth']->forgetGuards(); // reload from the session like a fresh request would
        $this->getJson('/api/v1/me')->assertOk()->assertJsonPath('data.id', $user->id);
    }

    public function test_register_validation(): void
    {
        $this->postJson('/api/v1/auth/register', $this->payload(['password' => 'short1', 'password_confirmation' => 'short1']))
            ->assertStatus(422)->assertJsonPath('code', 'validation_failed')->assertJsonPath('errors.password.0', fn ($m) => str_contains($m, '12 characters'));
        $this->postJson('/api/v1/auth/register', $this->payload(['password' => 'onlyletterslong', 'password_confirmation' => 'onlyletterslong']))->assertStatus(422);
        $this->postJson('/api/v1/auth/register', $this->payload(['password_confirmation' => 'different-9-pass']))->assertStatus(422);
        $this->postJson('/api/v1/auth/register', $this->payload(['email' => 'not-an-email']))->assertStatus(422);

        $this->postJson('/api/v1/auth/register', $this->payload())->assertCreated();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/register', $this->payload(['email' => 'SARA@example.com']))->assertStatus(422);
    }

    public function test_signed_link_verifies_email_and_redirects_to_frontend(): void
    {
        $user = $this->user(['email_verified_at' => null]);
        $url = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);

        $this->get($url)->assertRedirect(config('marketing.frontend_url').'/login?verified=1');
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $this->assertDatabaseHas('audit_logs', ['action' => 'auth.email_verified', 'actor_id' => $user->id]);
    }

    public function test_tampered_or_wrong_hash_links_do_not_verify(): void
    {
        $user = $this->user(['email_verified_at' => null]);
        $good = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1($user->email)]);

        $this->get($good.'x')->assertForbidden();
        $wrong = URL::temporarySignedRoute('verification.verify', now()->addHour(), ['id' => $user->id, 'hash' => sha1('other@example.com')]);
        $this->get($wrong)->assertRedirect(config('marketing.frontend_url').'/verify-email?status=invalid');
        $expired = URL::temporarySignedRoute('verification.verify', now()->subMinute(), ['id' => $user->id, 'hash' => sha1($user->email)]);
        $this->get($expired)->assertForbidden();
        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_resend_requires_auth_and_skips_verified_users(): void
    {
        $this->postJson('/api/v1/auth/email/resend')->assertUnauthorized();

        Notification::fake();
        $unverified = $this->user(['email_verified_at' => null]);
        $this->actingAs($unverified)->postJson('/api/v1/auth/email/resend')->assertStatus(202);
        Notification::assertSentTo($unverified, VerifyEmail::class);

        $verified = $this->user();
        $this->actingAs($verified)->postJson('/api/v1/auth/email/resend')->assertStatus(202);
        Notification::assertNotSentTo($verified, VerifyEmail::class);
    }

    public function test_unverified_users_cannot_create_organizations(): void
    {
        $this->actingAs($this->user(['email_verified_at' => null]))
            ->postJson('/api/v1/orgs', ['name' => 'Acme'])
            ->assertForbidden()->assertJsonPath('code', 'email_unverified');
        $this->assertSame(0, DB::table('organizations')->count());
    }
}
