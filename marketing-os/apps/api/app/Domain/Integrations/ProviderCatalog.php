<?php

declare(strict_types=1);

namespace App\Domain\Integrations;

/**
 * Catalog of providers Marketing OS will support. Phase 1 ships no adapters,
 * so every entry is `not_connected` and `available=false` with the phase in
 * which it becomes connectable. This is a catalog, not connection state.
 */
final class ProviderCatalog
{
    public const PROVIDERS = [
        ['key' => 'google_search_console', 'name' => 'Google Search Console', 'category' => 'seo', 'available_in_phase' => 2],
        ['key' => 'google_analytics_4', 'name' => 'Google Analytics 4', 'category' => 'analytics', 'available_in_phase' => 3],
        ['key' => 'google_ads', 'name' => 'Google Ads', 'category' => 'advertising', 'available_in_phase' => 4],
        ['key' => 'meta_ads', 'name' => 'Meta Ads', 'category' => 'advertising', 'available_in_phase' => 4],
        ['key' => 'shopify', 'name' => 'Shopify', 'category' => 'ecommerce', 'available_in_phase' => 7],
        ['key' => 'wordpress', 'name' => 'WordPress', 'category' => 'cms', 'available_in_phase' => 7],
    ];

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        return array_map(fn ($p) => $p + [
            'status' => 'not_connected',
            'available' => false,
            'unavailable_reason' => "Connection support arrives in Phase {$p['available_in_phase']}.",
        ], self::PROVIDERS);
    }
}
