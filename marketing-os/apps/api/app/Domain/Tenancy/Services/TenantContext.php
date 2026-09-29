<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Services;

use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Models\OrganizationUser;
use Closure;
use Illuminate\Support\Facades\DB;

/**
 * Holds the organization the current request / job is operating on and mirrors
 * it into the Postgres session (`app.current_org`) so row-level security applies.
 * Every code path that touches tenant data must run inside a context.
 */
final class TenantContext
{
    private ?Organization $organization = null;

    private ?OrganizationUser $membership = null;

    public function set(Organization $organization, ?OrganizationUser $membership = null): void
    {
        $this->organization = $organization;
        $this->membership = $membership;
        DB::select("select set_config('app.current_org', ?, false)", [$organization->id]);
    }

    public function clear(): void
    {
        $this->organization = null;
        $this->membership = null;
        DB::select("select set_config('app.current_org', '', false)");
    }

    public function organization(): ?Organization
    {
        return $this->organization;
    }

    public function organizationOrFail(): Organization
    {
        return $this->organization ?? throw new \LogicException('No tenant context is active.');
    }

    public function id(): ?string
    {
        return $this->organization?->id;
    }

    public function membership(): ?OrganizationUser
    {
        return $this->membership;
    }

    /** Run a callback (e.g. a queued job) inside an organization context, restoring the previous one. */
    public function run(Organization $organization, Closure $callback): mixed
    {
        $prevOrg = $this->organization;
        $prevMembership = $this->membership;
        $this->set($organization);
        try {
            return $callback();
        } finally {
            $prevOrg ? $this->set($prevOrg, $prevMembership) : $this->clear();
        }
    }
}
