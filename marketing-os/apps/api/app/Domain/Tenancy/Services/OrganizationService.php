<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Services;

use App\Domain\Audit\Audit;
use App\Domain\Billing\Models\Plan;
use App\Domain\Billing\Models\Subscription;
use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Models\OrganizationUser;
use App\Domain\Tenancy\Models\Role;
use Illuminate\Support\Facades\DB;

final class OrganizationService
{
    public function __construct(private readonly Audit $audit) {}

    /** @param array{name: string, timezone?: string, default_currency?: string} $data */
    public function create(User $owner, array $data): OrganizationUser
    {
        return DB::transaction(function () use ($owner, $data) {
            $org = Organization::create([
                'name' => $data['name'],
                'slug' => Organization::uniqueSlug($data['name']),
                'timezone' => $data['timezone'] ?? $owner->timezone ?? 'UTC',
                'default_currency' => strtoupper($data['default_currency'] ?? 'USD'),
                'owner_id' => $owner->id,
            ]);
            $membership = OrganizationUser::create([
                'organization_id' => $org->id, 'user_id' => $owner->id, 'role_id' => Role::byKey('owner')->id,
            ]);
            Subscription::create([
                'organization_id' => $org->id,
                'plan_id' => Plan::where('key', config('plans.default'))->firstOrFail()->id,
                'status' => 'active',
            ]);
            $this->audit->record('org.created', $org, ['name' => $org->name], $org, $owner);

            return $membership->load(['organization', 'role.permissions']);
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Organization $org, array $data): Organization
    {
        $org->fill($data)->save();
        $this->audit->record('org.updated', $org, ['changed' => array_keys($org->getChanges())], $org);

        return $org;
    }

    public function delete(Organization $org): void
    {
        DB::transaction(function () use ($org) {
            $this->audit->record('org.deleted', $org, ['name' => $org->name], $org);
            $org->delete(); // soft delete; hard purge is a Phase 10 data-retention job
        });
    }
}
