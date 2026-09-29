<?php

use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\EnsureEmailVerified;
use App\Http\Middleware\ResolveOrganization;
use App\Support\ApiExceptionRenderer;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Request;
use Illuminate\Session\Middleware\StartSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api_v1.php',
        commands: __DIR__.'/../routes/console.php',
        apiPrefix: 'api/v1',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Cookie-session SPA auth. The browser talks to the API same-origin (Next.js proxies /api and /sanctum).
        $middleware->api(prepend: [
            AssignRequestId::class,
            EncryptCookies::class,
            AddQueuedCookiesToResponse::class,
            StartSession::class,
            ValidateCsrfToken::class,
        ], append: ['throttle:api']);

        // Behind the Next.js proxy / a load balancer the client IP arrives in X-Forwarded-For. Trust only what is
        // configured (comma-separated IPs/CIDRs, or '*' when the network path is fully controlled).
        if ($trusted = env('TRUSTED_PROXIES')) {
            $middleware->trustProxies(at: $trusted === '*' ? '*' : array_map('trim', explode(',', $trusted)));
        }

        $middleware->alias([
            'org' => ResolveOrganization::class,
            'verified.email' => EnsureEmailVerified::class,
        ]);

        // Authenticate -> ResolveOrganization (sets tenant context) -> route model binding.
        $middleware->appendToPriorityList(AuthenticatesRequests::class, ResolveOrganization::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
        $exceptions->render(new ApiExceptionRenderer);
        $exceptions->render(fn (Throwable $e, Request $request) => app()->hasDebugModeEnabled() ? null : ApiExceptionRenderer::fallback($request));
    })->create();
