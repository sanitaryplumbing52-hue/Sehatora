<?php

declare(strict_types=1);

namespace App\Domain\Analytics;

/**
 * The only shape in which a metric may leave the analytics layer. `value` is
 * null unless status is Ok (or Stale, where the value is real but old).
 */
final readonly class MetricEnvelope
{
    /**
     * @param  array{provider: string, account: ?string}|null  $source
     * @param  array{start: string, end: string}|null  $period
     * @param  array<string, mixed>|null  $comparison
     * @param  array{label: string, href: string}|null  $action
     */
    public function __construct(
        public string $key,
        public string $label,
        public DataStatus $status,
        public ?float $value,
        public string $unit,
        public ?array $period,
        public ?array $comparison,
        public ?array $source,
        public ?string $lastSyncedAt,
        public string $calculation,
        public ?string $attributionNote,
        public ?string $lineageId,
        public ?string $reason = null,
        public ?array $action = null,
        public array $expectedSources = [],
        public ?string $currency = null,
    ) {
        if ($value !== null && ! in_array($status, [DataStatus::Ok, DataStatus::Stale], true)) {
            throw new \InvalidArgumentException("Metric {$key}: a value is only allowed with status ok/stale.");
        }
    }

    /** @param array{key:string,label:string,unit:string,calculation:string,sources:list<string>,attribution_note?:?string} $def */
    public static function notConnected(array $def, string $connectHref): self
    {
        return new self(
            key: $def['key'], label: $def['label'], status: DataStatus::NotConnected, value: null, unit: $def['unit'],
            period: null, comparison: null, source: null, lastSyncedAt: null, calculation: $def['calculation'],
            attributionNote: $def['attribution_note'] ?? null, lineageId: null,
            reason: 'No data source is connected for this metric.',
            action: ['label' => 'Connect account', 'href' => $connectHref],
            expectedSources: $def['sources'],
        );
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'status' => $this->status->value,
            'value' => $this->value,
            'unit' => $this->unit,
            'currency' => $this->currency,
            'period' => $this->period,
            'comparison' => $this->comparison,
            'source' => $this->source,
            'expected_sources' => $this->expectedSources,
            'last_synced_at' => $this->lastSyncedAt,
            'calculation' => $this->calculation,
            'attribution_note' => $this->attributionNote,
            'lineage_id' => $this->lineageId,
            'reason' => $this->reason,
            'action' => $this->action,
        ];
    }
}
