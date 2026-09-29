<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Domain\Audit\Audit;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Services\SessionService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Support\Problem;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class PasswordController extends Controller
{
    /** Always answers 202 so the endpoint cannot be used to enumerate accounts. */
    public function forgot(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email']]);
        Password::sendResetLink(['email' => mb_strtolower($data['email'])]);

        return response()->json(['message' => 'If that email is registered, a reset link is on its way.'], 202);
    }

    public function reset(Request $request, Audit $audit, SessionService $sessions): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', RegisterRequest::passwordRule()],
        ]);
        $data['email'] = mb_strtolower($data['email']);

        $status = Password::reset($data, function (User $user, string $password) use ($audit, $sessions) {
            $user->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
            $sessions->revokeAll($user); // sign out everywhere
            $audit->record('auth.password_reset', $user, actor: $user);
            event(new PasswordReset($user));
        });

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Your password has been reset. Sign in with the new password.'])
            : Problem::response(422, 'invalid_reset_token', 'This reset link is invalid or has expired.', 'Request a new reset link.');
    }
}
