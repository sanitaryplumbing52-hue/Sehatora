<?php

namespace Tests;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Models\OrganizationUser;
use App\Domain\Tenancy\Models\Role;
use App\Domain\Tenancy\Services\OrganizationService;
use App\Domain\Tenancy\Services\TenantContext;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function tearDown(): void
    {
        // The tenant context is a Postgres session setting; never let it leak between tests.
        if ($this->app) {
            $this->app->make(TenantContext::class)->clear();
        }
        parent::tearDown();
    }

    protected function user(array $attrs = []): User
    {
        return User::factory()->create($attrs);
    }

    /** Creates an organization owned by $owner (or a new verified user) via the real service. */
    protected function org(?User $owner = null, string $name = 'Acme Inc'): Organization
    {
        $owner ??= $this->user();
        $this->actingAs($owner);
        $membership = app(OrganizationService::class)->create($owner, ['name' => $name.' '.fake()->unique()->numerify('###')]);
        $this->app['auth']->forgetGuards();

        return $membership->organization;
    }

    protected function member(Organization $org, string $role, ?User $user = null): User
    {
        $user ??= $this->user();
        OrganizationUser::create(['organization_id' => $org->id, 'user_id' => $user->id, 'role_id' => Role::byKey($role)->id]);

        return $user;
    }

    /** Run a callback with the tenant context active (for fixtures touching tenant tables). */
    protected function inOrg(Organization $org, callable $fn): mixed
    {
        return $this->app->make(TenantContext::class)->run($org, $fn);
    }

    protected function onPlan(Organization $org, string $plan): void
    {
        \App\Domain\Billing\Models\Subscription::where('organization_id', $org->id)
            ->update(['plan_id' => \App\Domain\Billing\Models\Plan::where('key', $plan)->value('id')]);
    }

    protected function base(Organization $org): string
    {
        return "/api/v1/orgs/{$org->id}";
    }
}
