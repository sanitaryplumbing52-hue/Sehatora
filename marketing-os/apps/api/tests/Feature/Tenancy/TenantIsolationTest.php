<?php

namespace Tests\Feature\Tenancy;

use App\Domain\Projects\Models\Project;
use App\Domain\Tenancy\Models\Invitation;
use App\Domain\Tenancy\Models\Role;
use App\Domain\Tenancy\Services\TenantContext;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * The most important test class in the codebase: proves one tenant can never
 * reach another tenant's data at the HTTP, ORM and database layers.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{orgA: \App\Domain\Tenancy\Models\Organization, orgB: \App\Domain\Tenancy\Models\Organization, ids: array<string,string>} */
    private function twoTenants(): array
    {
        $a = $this->org(null, 'Tenant A');
        $b = $this->org(null, 'Tenant B');
        $this->actingAs($a->owner);
        $pa = $this->postJson($this->base($a).'/projects', ['name' => 'A Secret Project'])->assertCreated()->json('data.id');
        $wa = $this->postJson($this->base($a)."/projects/$pa/websites", ['url' => 'https://secret-a.example.com'])->assertCreated()->json('data.id');
        $inv = $this->inOrg($a, fn () => Invitation::create([
            'organization_id' => $a->id, 'email' => 'x@example.com', 'role_id' => Role::byKey('viewer')->id,
            'token_hash' => hash('sha256', 't'), 'expires_at' => now()->addDay(),
        ]));
        $this->app['auth']->forgetGuards();

        return ['orgA' => $a, 'orgB' => $b, 'ids' => ['project' => $pa, 'website' => $wa, 'invitation' => $inv->id, 'user' => $a->owner_id, 'org' => $a->id]];
    }

    public function test_every_org_scoped_route_is_closed_to_non_members_and_anonymous(): void
    {
        ['orgA' => $a, 'orgB' => $b, 'ids' => $ids] = $this->twoTenants();
        $checked = 0;

        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->uri(), 'api/v1/orgs/{org}')) {
                continue;
            }
            $uri = '/'.preg_replace_callback('/\{(\w+)\}/', fn ($m) => $ids[$m[1]] ?? $ids['org'], $route->uri());
            $method = $route->methods()[0];

            $this->app['auth']->forgetGuards();
            $this->json($method, $uri, [])->assertUnauthorized();

            // B is a full owner of their own org, yet must get 404 for A's org — on every verb and route.
            $this->actingAs($b->owner)->json($method, $uri, ['name' => 'x', 'email' => 'y@example.com', 'role' => 'viewer', 'url' => 'https://z.example.com', 'password' => 'correct-horse-battery-9'])
                ->assertNotFound("{$method} {$uri} leaked across tenants");
            $checked++;
        }
        $this->assertGreaterThan(20, $checked, 'route sweep found suspiciously few org-scoped routes');
        $this->assertSame(1, $this->inOrg($a, fn () => Project::count()), 'A\'s data must be untouched');
    }

    public function test_child_ids_from_another_tenant_are_404_inside_your_own_org(): void
    {
        ['orgB' => $b, 'ids' => $ids] = $this->twoTenants();
        $base = $this->base($b);
        $this->actingAs($b->owner);

        $this->getJson("$base/projects/{$ids['project']}")->assertNotFound();
        $this->patchJson("$base/projects/{$ids['project']}", ['name' => 'Stolen'])->assertNotFound();
        $this->deleteJson("$base/projects/{$ids['project']}")->assertNotFound();
        $this->getJson("$base/projects/{$ids['project']}/dashboard/overview")->assertNotFound();
        $this->getJson("$base/projects/{$ids['project']}/websites")->assertNotFound();
        $this->getJson("$base/projects/{$ids['project']}/websites/{$ids['website']}")->assertNotFound();
        $this->postJson("$base/projects/{$ids['project']}/websites", ['url' => 'https://new.example.com'])->assertNotFound();
        $this->deleteJson("$base/invitations/{$ids['invitation']}")->assertNotFound();
        $this->patchJson("$base/members/{$ids['user']}", ['role' => 'viewer'])->assertNotFound();
        $this->deleteJson("$base/members/{$ids['user']}")->assertNotFound();
        $this->getJson("$base/projects")->assertJsonCount(0, 'data');
        $this->getJson("$base/members")->assertJsonCount(1, 'data');
        $this->getJson("$base/audit-logs")->assertJsonMissing(['actor_id' => $ids['user']]);
    }

    public function test_eloquent_scope_fails_closed_without_a_tenant_context(): void
    {
        ['orgA' => $a] = $this->twoTenants();
        $this->assertSame(0, Project::count());
        $this->assertSame(1, $this->inOrg($a, fn () => Project::count()));
        $this->assertSame(0, Project::count(), 'context must be cleared after run()');
    }

    public function test_postgres_rls_blocks_even_when_the_orm_scope_is_bypassed(): void
    {
        ['orgA' => $a, 'orgB' => $b] = $this->twoTenants();
        $tenant = app(TenantContext::class);

        $this->assertSame(0, DB::table('projects')->count(), 'no context => no rows');
        $tenant->set($b);
        $this->assertSame(0, DB::table('projects')->count(), 'org B must not see org A rows via raw SQL');
        $this->assertSame(0, Project::withoutGlobalScopes()->count());
        $this->assertSame(0, DB::table('websites')->count());
        $this->assertSame(0, DB::table('domains')->count());
        $tenant->set($a);
        $this->assertSame(1, DB::table('projects')->count());
        $tenant->clear();
    }

    public function test_rls_rejects_writes_into_another_tenant(): void
    {
        ['orgA' => $a, 'orgB' => $b] = $this->twoTenants();
        app(TenantContext::class)->set($b);

        $this->expectException(QueryException::class);
        try {
            DB::transaction(fn () => DB::table('projects')->insert(['id' => (string) \Illuminate\Support\Str::uuid(), 'organization_id' => $a->id, 'name' => 'Injected', 'currency' => 'USD', 'timezone' => 'UTC']));
        } finally {
            app(TenantContext::class)->clear();
        }
    }

    public function test_rls_update_and_delete_of_foreign_rows_affect_nothing(): void
    {
        ['orgA' => $a, 'orgB' => $b] = $this->twoTenants();
        app(TenantContext::class)->set($b);
        $this->assertSame(0, DB::table('projects')->update(['name' => 'pwned']));
        $this->assertSame(0, DB::table('projects')->delete());
        app(TenantContext::class)->clear();
        $this->assertSame('A Secret Project', $this->inOrg($a, fn () => Project::first()->name));
    }

    public function test_audit_log_is_tenant_scoped_and_append_only(): void
    {
        ['orgA' => $a, 'orgB' => $b] = $this->twoTenants();
        $this->inOrg($a, fn () => $this->assertGreaterThan(0, DB::table('audit_logs')->where('action', 'project.created')->count()));
        $this->inOrg($b, fn () => $this->assertSame(0, DB::table('audit_logs')->where('action', 'project.created')->count()));

        // No UPDATE/DELETE policy exists, so RLS makes every row immutable to the app role; a trigger backs this up.
        $this->inOrg($a, function () {
            $before = DB::table('audit_logs')->count();
            $this->assertSame(0, DB::table('audit_logs')->update(['action' => 'tampered']));
            $this->assertSame(0, DB::table('audit_logs')->delete());
            $this->assertSame($before, DB::table('audit_logs')->count());
            $this->assertSame(0, DB::table('audit_logs')->where('action', 'tampered')->count());
        });
    }

    public function test_context_is_cleared_after_each_request(): void
    {
        ['orgA' => $a] = $this->twoTenants();
        $this->actingAs($a->owner)->getJson($this->base($a).'/projects')->assertOk();
        $this->assertNull(app(TenantContext::class)->id());
        $this->assertSame(0, DB::table('projects')->count());
    }
}
