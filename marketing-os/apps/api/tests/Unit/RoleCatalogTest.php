<?php

namespace Tests\Unit;

use App\Domain\Tenancy\Models\Permission;
use App\Domain\Tenancy\Models\Role;
use App\Domain\Tenancy\Support\RoleCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_six_system_roles_exist_with_spec_names(): void
    {
        $this->assertSame(['owner', 'admin', 'manager', 'analyst', 'editor', 'viewer'], Role::orderBy('rank')->pluck('key')->all());
    }

    public function test_owner_has_every_permission_and_viewer_is_read_only(): void
    {
        $all = Permission::pluck('key')->sort()->values()->all();
        $this->assertSame($all, Role::byKey('owner')->permissions->pluck('key')->sort()->values()->all());

        $viewer = Role::byKey('viewer')->permissions->pluck('key')->all();
        foreach ($viewer as $key) {
            $this->assertMatchesRegularExpression('/\.view$/', $key);
        }
        $this->assertNotContains('audit.view', $viewer);
    }

    public function test_only_owner_can_delete_org_or_manage_billing(): void
    {
        foreach (['admin', 'manager', 'analyst', 'editor', 'viewer'] as $role) {
            $keys = Role::byKey($role)->permissions->pluck('key')->all();
            $this->assertNotContains('org.delete', $keys, $role);
            $this->assertNotContains('billing.manage', $keys, $role);
        }
    }

    public function test_sync_is_idempotent(): void
    {
        $before = [Role::count(), Permission::count()];
        (new RoleCatalog)->sync();
        (new RoleCatalog)->sync();
        $this->assertSame($before, [Role::count(), Permission::count()]);
    }
}
