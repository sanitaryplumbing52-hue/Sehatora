<?php

declare(strict_types=1);

namespace App\Domain\Analytics;

/**
 * Definitions of headline metrics: what they mean, how they're calculated and
 * which providers can supply them. Drives the "source / calculation" popovers.
 */
/**
 * Units: count | percent (value is a fraction, 0.034 = 3.4%) | ratio (e.g. ROAS, shown as 5.42×) | currency | position.
 */
final class MetricRegistry
{
    public const OVERVIEW = [
        ['key' => 'organic_clicks', 'label' => 'Organic clicks', 'unit' => 'count', 'calculation' => 'SUM(clicks)', 'sources' => ['google_search_console']],
        ['key' => 'organic_impressions', 'label' => 'Organic impressions', 'unit' => 'count', 'calculation' => 'SUM(impressions)', 'sources' => ['google_search_console']],
        ['key' => 'organic_ctr', 'label' => 'Organic CTR', 'unit' => 'percent', 'calculation' => 'SUM(clicks) ÷ SUM(impressions)', 'sources' => ['google_search_console']],
        ['key' => 'organic_avg_position', 'label' => 'Average position', 'unit' => 'position', 'calculation' => 'Impression-weighted average position', 'sources' => ['google_search_console']],
        ['key' => 'paid_spend', 'label' => 'Paid spend', 'unit' => 'currency', 'calculation' => 'SUM(spend)', 'sources' => ['google_ads', 'meta_ads'], 'attribution_note' => 'Spend is summed only when all accounts share one currency.'],
        ['key' => 'paid_conversions', 'label' => 'Paid conversions', 'unit' => 'count', 'calculation' => 'SUM(platform-reported conversions)', 'sources' => ['google_ads', 'meta_ads'], 'attribution_note' => 'Platform-reported; attribution models and windows differ between platforms.'],
        ['key' => 'cpa', 'label' => 'CPA', 'unit' => 'currency', 'calculation' => 'Ad spend ÷ Conversions', 'sources' => ['google_ads', 'meta_ads']],
        ['key' => 'roas', 'label' => 'ROAS', 'unit' => 'ratio', 'calculation' => 'Conversion value ÷ Ad spend', 'sources' => ['google_ads', 'meta_ads']],
        ['key' => 'revenue', 'label' => 'Revenue', 'unit' => 'currency', 'calculation' => 'SUM(revenue)', 'sources' => ['google_analytics_4']],
        ['key' => 'leads', 'label' => 'Leads', 'unit' => 'count', 'calculation' => 'Count of lead conversion events', 'sources' => ['google_analytics_4']],
        ['key' => 'conversion_rate', 'label' => 'Conversion rate', 'unit' => 'percent', 'calculation' => 'Conversions ÷ Sessions', 'sources' => ['google_analytics_4']],
    ];
}
