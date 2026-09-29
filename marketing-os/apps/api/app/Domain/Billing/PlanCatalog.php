<?php

declare(strict_types=1);

namespace App\Domain\Billing;

use App\Domain\Billing\Models\Plan;
use Illuminate\Support\Facades\DB;

/** Syncs config/plans.php into the plans / plan_entitlements tables. Plans are data, not code. */
final class PlanCatalog
{
    public function sync(): void
    {
        DB::transaction(function () {
            foreach (config('plans.plans') as $key => $def) {
                $plan = Plan::updateOrCreate(['key' => $key], ['name' => $def['name'], 'is_public' => $def['public'] ?? true]);
                $features = [];
                foreach ($def['features'] as $feature => $value) {
                    $features[] = $feature;
                    $plan->entitlements()->updateOrCreate(['feature' => $feature], is_bool($value)
                        ? ['type' => 'flag', 'enabled' => $value, 'limit_value' => null]
                        : ['type' => 'limit', 'enabled' => true, 'limit_value' => $value === 'unlimited' ? null : (int) $value]);
                }
                $plan->entitlements()->whereNotIn('feature', $features)->delete();
            }
        });
    }
}
