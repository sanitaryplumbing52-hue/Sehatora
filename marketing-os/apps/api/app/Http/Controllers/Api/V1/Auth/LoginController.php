<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Audit\Audit;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\LoginActivityRecorder;
use App\Domain\Identity\Services\TwoFactorService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Support\Problem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class LoginController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    /** Across all IPs, so a distributed guessing attack on one account is also slowed. */
    private const MAX_ATTEMPTS_PER_EMAIL = 25;

    private const PENDING_TTL_MINUTES = 10;

    public function __construct(
        private readonly Audit $audit,
        private readonly LoginActivityRecorder $activity,
        private readonly TwoFactorService $twoFactor,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $email = mb_strtolower($request->string('email')->toString());
        $throttleKey = 'login:'.sha1($email.'|'.$request->ip());

        $emailKey = 'login-email:'.sha1($email);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS) || RateLimiter::tooManyAttempts($emailKey, self::MAX_ATTEMPTS_PER_EMAIL)) {
            $this->activity->record($request, $email, 'locked');

            return Problem::response(429, 'login_locked', 'Too many sign-in attempts.',
                'Try again later.', ['retry_after' => max(RateLimiter::availableIn($throttleKey), RateLimiter::availableIn($emailKey))]);
        }

        $user = User::where('email', $email)->first();
        // Constant-ish time: always hash-compare, even for unknown emails.
        $valid = Hash::check($request->string('password')->toString(), $user?->password ?? '$2y$12$'.str_repeat('a', 53));
        if (! $user || ! $valid) {
            RateLimiter::hit($throttleKey, 300);
            RateLimiter::hit($emailKey, 900);
            $this->activity->record($request, $email, 'failed', $user);
            $this->audit->record('auth.login_failed', null, ['email' => $email], actorEmail: $email);

            return Problem::response(422, 'invalid_credentials', 'These credentials do not match our records.', null,
                ['errors' => ['email' => ['These credentials do not match our records.']]]);
        }

        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put('auth.two_factor', [
                'user_id' => $user->id, 'remember' => $request->boolean('remember'),
                'expires_at' => now()->addMinutes(self::PENDING_TTL_MINUTES)->getTimestamp(),
            ]);

            return response()->json(['two_factor_required' => true]);
        }

        RateLimiter::clear($throttleKey);

        return $this->completeLogin($request, $user, $request->boolean('remember'));
    }

    public function twoFactorChallenge(Request $request): JsonResponse
    {
        $data = $request->validate(['code' => ['nullable', 'string'], 'recovery_code' => ['nullable', 'string']]);
        $pending = $request->session()->get('auth.two_factor');
        $user = $pending && $pending['expires_at'] > now()->getTimestamp() ? User::find($pending['user_id']) : null;
        if (! $user) {
            return Problem::response(422, 'two_factor_expired', 'Your sign-in session expired.', 'Sign in again.');
        }

        $key = 'two-factor:'.$user->id;
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            return Problem::response(429, 'login_locked', 'Too many attempts.', null, ['retry_after' => RateLimiter::availableIn($key)]);
        }

        $ok = ! empty($data['code'])
            ? $this->twoFactor->verifyTotp($user, $data['code'])
            : (! empty($data['recovery_code']) && $this->twoFactor->consumeRecoveryCode($user, $data['recovery_code']));

        if (! $ok) {
            RateLimiter::hit($key, 300);
            $this->activity->record($request, $user->email, 'two_factor_failed', $user);
            $this->audit->record('auth.two_factor_failed', $user, actor: $user);

            return Problem::response(422, 'invalid_two_factor_code', 'That code is not valid.', null,
                ['errors' => ['code' => ['That code is not valid.']]]);
        }

        RateLimiter::clear($key);
        $request->session()->forget('auth.two_factor');

        return $this->completeLogin($request, $user, (bool) $pending['remember']);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->audit->record('auth.logout', $user);
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(status: 204);
    }

    private function completeLogin(Request $request, User $user, bool $remember): JsonResponse
    {
        Auth::login($user, $remember);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        $this->activity->record($request, $user->email, 'success', $user);
        $this->audit->record('auth.login', $user, actor: $user);

        return (new UserResource($user))->response();
    }
}
