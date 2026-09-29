<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Services;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Models\OrganizationUser;

final class PermissionChecker
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function membership(User $user, Organization $organization): ?OrganizationUser
    {
        $current = $this->tenant->membership();
        if ($current && $current->user_id === $user->id && $current->organization_id === $organization->id) {
            return $current;
        }

        return OrganizationUser::with('role')
            ->where('user_id', $user->id)->where('organization_id', $organization->id)->first();
    }

    public function can(User $user, Organization $organization, string $permission): bool
    {
        $membership = $this->membership($user, $organization);

        return $membership !== null && in_array($permission, $membership->permissionKeys(), true);
    }
}
