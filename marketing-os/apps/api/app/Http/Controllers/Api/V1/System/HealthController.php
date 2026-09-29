<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\System;

use App\Domain\System\HealthChecker;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HealthController extends Controller
{
    /** Public, coarse: status only, no internals. */
    public function show(HealthChecker $health): JsonResponse
    {
        $overall = $health->overall($health->checks());

        return response()->json(['status' => $overall], $overall === 'ok' ? 200 : 503);
    }

    /** Requires the HEALTH_CHECK_TOKEN bearer token (disabled when unset). */
    public function details(Request $request, HealthChecker $health): JsonResponse
    {
        $expected = (string) config('marketing.health.token');
        if ($expected === '' || ! hash_equals($expected, (string) $request->bearerToken())) {
            abort(404);
        }
        $checks = $health->checks();

        return response()->json(['status' => $health->overall($checks), 'checks' => $checks]);
    }
}
