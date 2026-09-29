<?php

declare(strict_types=1);

namespace App\Domain\Analytics;

use App\Domain\Projects\Models\Project;

/**
 * Builds the executive overview. Phase 1 has no data sources, so every metric
 * is honestly reported as not_connected. Later phases plug provider-backed
 * resolvers in here; the envelope contract stays identical.
 */
final class OverviewService
{
    /** @return list<MetricEnvelope> */
    public function metrics(Project $project, string $orgKey): array
    {
        $href = "/{$orgKey}/integrations";

        return array_map(
            fn (array $def) => MetricEnvelope::notConnected($def, $href),
            MetricRegistry::OVERVIEW,
        );
    }
}
