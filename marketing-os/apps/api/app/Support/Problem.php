<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Http\JsonResponse;

/** RFC 9457 problem-details responses. Messages are user-safe; never include stack traces. */
final class Problem
{
    /**
     * @param  array<string, mixed>  $extra  merged into the body (e.g. errors, action, retry_after)
     */
    public static function response(int $status, string $code, string $title, ?string $detail = null, array $extra = []): JsonResponse
    {
        $body = array_filter([
            'type' => 'https://docs.marketing-os.local/problems/'.str_replace('_', '-', $code),
            'title' => $title,
            'status' => $status,
            'code' => $code,
            'detail' => $detail,
            'request_id' => app()->bound('request') ? request()->attributes->get('request_id') : null,
        ], fn ($v) => $v !== null);

        return response()->json($body + $extra, $status, ['Content-Type' => 'application/problem+json']);
    }
}
