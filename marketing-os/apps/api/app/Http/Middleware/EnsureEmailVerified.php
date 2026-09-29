<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\Problem;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureEmailVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user && ! $user->hasVerifiedEmail()) {
            return Problem::response(403, 'email_unverified', 'Verify your email address to continue.',
                'Open the verification link we emailed you, or request a new one.',
                ['action' => ['label' => 'Resend verification email', 'href' => '/verify-email']]);
        }

        return $next($request);
    }
}
