<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_update(): void
    {
        $user = $this->user();
        $this->actingAs($user)->patchJson('/api/v1/me', ['name' => 'New Name', 'timezone' => 'Asia/Dubai'])
            ->assertOk()->assertJsonPath('data.name', 'New Name')->assertJsonPath('data.timezone', 'Asia/Dubai');
        $this->patchJson('/api/v1/me', ['timezone' => 'Mars/Base'])->assertStatus(422);
        $this->patchJson('/api/v1/me', ['email' => 'hijack@example.com'])->assertOk();
        $this->assertNotSame('hijack@example.com', $user->fresh()->email);
    }

    public function test_me_never_exposes_secrets(): void
    {
        $body = $this->actingAs($this->user())->getJson('/api/v1/me')->assertOk()->getContent();
        foreach (['password', 'two_factor_secret', 'remember_token', 'recovery'] as $needle) {
            $this->assertStringNotContainsString($needle, $body);
        }
    }

    public function test_change_password_requires_current_password_and_signs_out_other_sessions(): void
    {
        $user = $this->user();
        DB::table('sessions')->insert(['id' => 'other-device', 'user_id' => $user->id, 'payload' => 'x', 'last_activity' => time()]);

        $this->actingAs($user)->putJson('/api/v1/me/password', ['current_password' => 'nope', 'password' => 'another-good-pass-1', 'password_confirmation' => 'another-good-pass-1'])->assertStatus(422);
        $this->putJson('/api/v1/me/password', ['current_password' => 'correct-horse-battery-9', 'password' => 'another-good-pass-1', 'password_confirmation' => 'another-good-pass-1'])->assertOk();

        $this->assertTrue(password_verify('another-good-pass-1', $user->fresh()->password));
        $this->assertSame(0, DB::table('sessions')->where('id', 'other-device')->count());
    }

    public function test_sessions_are_listed_and_revocable_only_by_owner_without_leaking_ids(): void
    {
        $user = $this->user();
        $other = $this->user();
        DB::table('sessions')->insert(['id' => 'raw-session-id-1', 'user_id' => $user->id, 'ip_address' => '1.2.3.4', 'user_agent' => 'Firefox', 'payload' => 'x', 'last_activity' => time()]);
        DB::table('sessions')->insert(['id' => 'raw-session-id-2', 'user_id' => $other->id, 'payload' => 'x', 'last_activity' => time()]);

        $list = $this->actingAs($user)->getJson('/api/v1/me/sessions')->assertOk();
        $this->assertCount(1, $list->json('data'));
        $this->assertStringNotContainsString('raw-session-id', $list->getContent());
        $publicId = $list->json('data.0.id');

        $this->deleteJson("/api/v1/me/sessions/{$publicId}")->assertNoContent();
        $this->assertDatabaseMissing('sessions', ['id' => 'raw-session-id-1']);
        $this->assertDatabaseHas('sessions', ['id' => 'raw-session-id-2']);
        $this->deleteJson('/api/v1/me/sessions/raw-session-id-2')->assertNotFound();
        $this->assertDatabaseHas('sessions', ['id' => 'raw-session-id-2']);
    }

    public function test_login_activity_only_shows_own_history(): void
    {
        $a = $this->user(['email' => 'a@example.com']);
        $this->user(['email' => 'b@example.com']);
        $this->postJson('/api/v1/auth/login', ['email' => 'b@example.com', 'password' => 'wrong-wrong-12345']);
        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'wrong-wrong-12345']);

        $rows = $this->actingAs($a)->getJson('/api/v1/me/login-activity')->assertOk()->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame('failed', $rows[0]['outcome']);
    }
}
