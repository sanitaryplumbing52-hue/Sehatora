<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'correct-horse-battery-9';

    /** A valid code from the next 30s window (the current one was consumed by enrolment). */
    private function nextOtp(string $secret): string
    {
        $g = new Google2FA;

        return $g->oathTotp($secret, $g->getTimestamp() + 1);
    }

    private function enrol($user): array
    {
        $secret = $this->actingAs($user)->postJson('/api/v1/me/2fa/enable', ['password' => self::PASSWORD])
            ->assertOk()->assertJsonStructure(['data' => ['secret', 'otpauth_url', 'qr_svg']])->json('data.secret');
        $codes = $this->postJson('/api/v1/me/2fa/confirm', ['code' => (new Google2FA)->getCurrentOtp($secret)])
            ->assertOk()->json('data.recovery_codes');

        return [$secret, $codes];
    }

    public function test_enrolment_requires_password_and_correct_code(): void
    {
        $user = $this->user();
        $this->actingAs($user)->postJson('/api/v1/me/2fa/enable', ['password' => 'wrong'])->assertStatus(422);
        $this->postJson('/api/v1/me/2fa/enable', ['password' => self::PASSWORD])->assertOk();
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
        $this->postJson('/api/v1/me/2fa/confirm', ['code' => '000000'])->assertStatus(422)->assertJsonPath('code', 'invalid_two_factor_code');
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }

    public function test_secret_is_encrypted_at_rest(): void
    {
        $user = $this->user();
        [$secret] = $this->enrol($user);
        $raw = \DB::table('users')->where('id', $user->id)->value('two_factor_secret');
        $this->assertStringNotContainsString($secret, $raw);
        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());
        $this->assertSame($secret, $user->fresh()->two_factor_secret);
    }

    public function test_login_requires_second_factor_then_succeeds_with_totp(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        [$secret] = $this->enrol($user);
        $this->app['auth']->forgetGuards();
        $this->flushSession();

        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => self::PASSWORD])
            ->assertOk()->assertJsonPath('two_factor_required', true);
        $this->assertGuest();
        $this->getJson('/api/v1/me')->assertUnauthorized();

        $this->postJson('/api/v1/auth/2fa/challenge', ['code' => '123456'])->assertStatus(422);
        $this->assertGuest();

        $this->postJson('/api/v1/auth/2fa/challenge', ['code' => $this->nextOtp($secret)])->assertOk();
        $this->assertAuthenticatedAs($user);
    }

    public function test_totp_code_cannot_be_replayed(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        [$secret] = $this->enrol($user);
        $code = (new Google2FA)->getCurrentOtp($secret);
        // The confirm step already consumed this exact code; a login with it must fail.
        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => self::PASSWORD])->assertOk();
        $this->postJson('/api/v1/auth/2fa/challenge', ['code' => $code])->assertStatus(422);
    }

    public function test_recovery_codes_work_once(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        [, $codes] = $this->enrol($user);
        $this->assertCount(8, $codes);
        $stored = \DB::table('users')->where('id', $user->id)->value('two_factor_recovery_codes');
        $this->assertStringNotContainsString($codes[0], $stored);

        foreach ([true, false] as $shouldWork) {
            $this->app['auth']->forgetGuards();
            $this->flushSession();
            $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => self::PASSWORD])->assertOk();
            $res = $this->postJson('/api/v1/auth/2fa/challenge', ['recovery_code' => $codes[0]]);
            $shouldWork ? $res->assertOk() : $res->assertStatus(422);
        }
    }

    public function test_pending_challenge_is_rate_limited(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        $this->enrol($user);
        $this->app['auth']->forgetGuards();
        $this->flushSession();
        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => self::PASSWORD])->assertOk();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/2fa/challenge', ['code' => '111111'])->assertStatus(422);
        }
        $this->postJson('/api/v1/auth/2fa/challenge', ['code' => '111111'])->assertStatus(429);
    }

    public function test_disable_requires_password(): void
    {
        $user = $this->user();
        $this->enrol($user);
        $this->deleteJson('/api/v1/me/2fa', ['password' => 'wrong'])->assertStatus(422);
        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());
        $this->deleteJson('/api/v1/me/2fa', ['password' => self::PASSWORD])->assertNoContent();
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
        $this->assertNull($user->fresh()->two_factor_secret);
    }
}
