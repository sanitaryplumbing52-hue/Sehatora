<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

/** Maps exceptions on /api/* to problem-details JSON. Internals are never exposed. */
final class ApiExceptionRenderer
{
    public function __invoke(Throwable $e, Request $request): ?JsonResponse
    {
        if (! $request->is('api/*')) {
            return null;
        }

        return match (true) {
            $e instanceof DomainRuleViolation => Problem::response($e->status, $e->errorCode, $e->getMessage(), $e->detail, $e->extra),
            $e instanceof ValidationException => Problem::response(422, 'validation_failed', 'The given data was invalid.', null, ['errors' => $e->errors()]),
            $e instanceof AuthenticationException => Problem::response(401, 'unauthenticated', 'You are not signed in.', 'Sign in to continue.'),
            $e instanceof AuthorizationException => Problem::response(403, 'forbidden', 'You do not have permission to do this.', 'Ask an organization admin to change your role if you need access.'),
            $e instanceof ModelNotFoundException, $e instanceof NotFoundHttpException => Problem::response(404, 'not_found', 'Resource not found.'),
            $e instanceof TokenMismatchException => Problem::response(419, 'csrf_mismatch', 'Your session security token expired.', 'Refresh the page and try again.'),
            $e instanceof TooManyRequestsHttpException => Problem::response(429, 'rate_limited', 'Too many requests.', 'Wait a moment before trying again.', ['retry_after' => (int) ($e->getHeaders()['Retry-After'] ?? 60)]),
            $e instanceof HttpExceptionInterface => Problem::response($e->getStatusCode(), $e->getStatusCode() === 403 ? 'forbidden' : 'http_error', $e->getStatusCode() === 403 ? 'You do not have permission to do this.' : 'The request could not be completed.'),
            default => null,
        };
    }

    public static function fallback(Request $request): ?JsonResponse
    {
        return $request->is('api/*')
            ? Problem::response(500, 'server_error', 'An unexpected error occurred.', 'The problem has been logged. Quote the request ID if you contact support.')
            : null;
    }
}
