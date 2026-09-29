<?php

declare(strict_types=1);

namespace App\Domain\System;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * Infrastructure health. Third-party APIs are deliberately not probed here:
 * a provider outage must never make our own health check fail. Provider state
 * is reported per integration (Data Health), from Phase 2 on.
 */
final class HealthChecker
{
    /** @return array<string, array{status: string, detail?: string}> */
    public function checks(): array
    {
        return [
            'database' => $this->probe(fn () => DB::select('select 1')),
            'cache' => $this->probe(function () {
                Cache::put('health', '1', 10);
                if (Cache::get('health') !== '1') {
                    throw new \RuntimeException('cache read-back failed');
                }
            }),
            'queue' => $this->probe(fn () => Queue::connection()->size('default')),
            'storage' => $this->probe(function () {
                $disk = Storage::disk('local');
                $disk->put('health/probe', 'ok');
                $ok = $disk->get('health/probe') === 'ok';
                $disk->delete('health/probe');
                if (! $ok) {
                    throw new \RuntimeException('storage read-back failed');
                }
            }),
            'external_apis' => ['status' => 'not_applicable', 'detail' => 'No provider integrations are connected yet.'],
        ];
    }

    public function overall(array $checks): string
    {
        foreach ($checks as $c) {
            if ($c['status'] === 'down') {
                return 'down';
            }
        }

        return 'ok';
    }

    /** @return array{status: string, detail?: string} */
    private function probe(callable $fn): array
    {
        try {
            $fn();

            return ['status' => 'ok'];
        } catch (Throwable $e) {
            report($e);

            return ['status' => 'down', 'detail' => 'Check failed; see server logs.'];
        }
    }
}
