<?php

namespace Tests\Unit;

use App\Domain\Analytics\DataStatus;
use App\Domain\Analytics\MetricEnvelope;
use App\Domain\Analytics\MetricRegistry;
use PHPUnit\Framework\TestCase;

class MetricEnvelopeTest extends TestCase
{
    public function test_not_connected_envelope_never_carries_a_value(): void
    {
        foreach (MetricRegistry::OVERVIEW as $def) {
            $e = MetricEnvelope::notConnected($def, '/acme/integrations')->toArray();
            $this->assertSame('not_connected', $e['status']);
            $this->assertNull($e['value']);
            $this->assertNull($e['comparison']);
            $this->assertNull($e['last_synced_at']);
            $this->assertSame('/acme/integrations', $e['action']['href']);
            $this->assertNotEmpty($e['calculation']);
            $this->assertNotEmpty($e['expected_sources']);
        }
    }

    public function test_value_is_rejected_unless_status_is_ok_or_stale(): void
    {
        foreach ([DataStatus::NotConnected, DataStatus::Unavailable, DataStatus::InsufficientData, DataStatus::Error, DataStatus::NoData] as $status) {
            try {
                new MetricEnvelope('k', 'K', $status, 12.0, 'count', null, null, null, null, 'x', null, null);
                $this->fail("value allowed with {$status->value}");
            } catch (\InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }
        $ok = new MetricEnvelope('k', 'K', DataStatus::Ok, 12.0, 'count', null, null, null, null, 'x', null, null);
        $this->assertSame(12.0, $ok->toArray()['value']);
    }

    public function test_registry_keys_are_unique_and_cover_spec_overview(): void
    {
        $keys = array_column(MetricRegistry::OVERVIEW, 'key');
        $this->assertSame($keys, array_values(array_unique($keys)));
        foreach (['organic_clicks', 'organic_impressions', 'organic_ctr', 'organic_avg_position', 'paid_spend', 'paid_conversions', 'cpa', 'roas', 'revenue', 'leads', 'conversion_rate'] as $k) {
            $this->assertContains($k, $keys);
        }
    }
}
