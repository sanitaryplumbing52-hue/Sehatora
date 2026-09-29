<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Support;

use App\Domain\Tenancy\Models\Permission;
use App\Domain\Tenancy\Models\Role;
use Illuminate\Support\Facades\DB;

/**
 * Single source of truth for system roles and permission keys. `sync()` is
 * idempotent; new permissions are added here and synced by migration or
 * `php artisan mios:sync-roles`.
 */
final class RoleCatalog
{
    public const PERMISSIONS = [
        'org.view' => 'View organization details',
        'org.update' => 'Update organization settings',
        'org.delete' => 'Delete the organization',
        'billing.manage' => 'Manage plan and billing',
        'members.view' => 'View members and invitations',
        'members.manage' => 'Invite, change roles of, and remove members',
        'projects.view' => 'View projects and websites',
        'projects.manage' => 'Create, edit, archive and delete projects and websites',
        'integrations.view' => 'View integration status',
        'integrations.manage' => 'Connect and disconnect integrations',
        'audit.view' => 'View the audit log',
    ];

    private const VIEW = ['org.view', 'projects.view', 'integrations.view'];

    /** role key => [name, rank, description, permissions|'*'] */
    public const ROLES = [
        'owner' => ['Owner', 1, 'Full control including billing and deletion', '*'],
        'admin' => ['Admin', 2, 'Manage everything except billing and organization deletion', [
            'org.view', 'org.update', 'members.view', 'members.manage', 'projects.view', 'projects.manage',
            'integrations.view', 'integrations.manage', 'audit.view',
        ]],
        'manager' => ['Manager', 3, 'Manage projects and integrations', [
            'org.view', 'members.view', 'projects.view', 'projects.manage', 'integrations.view', 'integrations.manage',
        ]],
        'analyst' => ['Analyst', 4, 'Read access to data and members', [...self::VIEW, 'members.view']],
        'editor' => ['Editor', 5, 'Read access; content editing arrives with later modules', [...self::VIEW, 'members.view']],
        'viewer' => ['Viewer', 6, 'Read-only access', self::VIEW],
    ];

    public function sync(): void
    {
        DB::transaction(function () {
            $permissionIds = [];
            foreach (self::PERMISSIONS as $key => $description) {
                $permissionIds[$key] = Permission::updateOrCreate(['key' => $key], ['description' => $description])->id;
            }

            foreach (self::ROLES as $key => [$name, $rank, $description, $perms]) {
                $role = Role::updateOrCreate(['key' => $key], [
                    'name' => $name, 'rank' => $rank, 'description' => $description, 'is_system' => true,
                ]);
                $keys = $perms === '*' ? array_keys(self::PERMISSIONS) : $perms;
                $role->permissions()->sync(array_map(fn ($k) => $permissionIds[$k], $keys));
            }
        });
    }
}
