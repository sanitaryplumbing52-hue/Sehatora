<?php

declare(strict_types=1);

namespace App\Domain\Billing;

use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\PlanEntitlement;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Tenancy\Models\Organization;

/**
 * Feature / limit access for an organization, resolved from its active
 * subscription (falling back to the default plan). Nothing else in the codebase
 * should know which plan an organization is on.
 */
final class Entitlements
{
    /** @var array<string, PlanEntitlement>|null */
    private ?array $map = null;

    private function __construct(private readonly Organization $organization) {}

    public static function for(Organization $organization): self
    {
        return new self($organization);
    }

    public function planKey(): string
    {
        return $this->plan()->key;
    }

    public function can(string $feature): bool
    {
        $e = $this->entitlements()[$feature] ?? null;

        return $e !== null && $e->enabled && ($e->type === 'flag' || $e->limit_value === null || $e->limit_value > 0);
    }

    /** null = unlimited; 0 = not available. */
    public function limit(string $feature): ?int
    {
        $e = $this->entitlements()[$feature] ?? null;
        if ($e === null || ! $e->enabled) {
            return 0;
        }

        return $e->limit_value;
    }

    public function allows(string $feature, int $currentUsage): bool
    {
        $limit = $this->limit($feature);

        return $limit === null || $currentUsage < $limit;
    }

    private function plan(): Plan
    {
        $subscription = Subscription::query()
            ->where('organization_id', $this->organization->id)
            ->whereIn('status', ['active', 'trialing', 'past_due'])
            ->latest()->with('plan')->first();

        return $subscription?->plan ?? Plan::where('key', config('plans.default'))->firstOrFail();
    }

    /** @return array<string, PlanEntitlement> */
    private function entitlements(): array
    {
        return $this->map ??= $this->plan()->entitlements->keyBy('feature')->all();
    }
}
