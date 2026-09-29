<?php

namespace Tests\Feature\Tenancy;

use App\Domain\Billing\Entitlements;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_org_makes_the_creator_owner_on_the_free_plan_and_audits_it(): void
    {
        $user = $this->user();
        $res = $this->actingAs($user)->postJson('/api/v1/orgs', ['name' => 'Dubai Heaters LLC'])->assertCreated();

        $res->assertJsonPath('data.role.key', 'owner')->assertJsonPath('data.organization.slug', 'dubai-heaters-llc');
        $this->assertContains('org.delete', $res->json('data.permissions'));

        $org = \App\Domain\Tenancy\Models\Organization::firstWhere('slug', 'dubai-heaters-llc');
        $this->assertSame('free', Entitlements::for($org)->planKey());
        $this->assertSame($user->id, $org->owner_id);
        $this->inOrg($org, fn () => $this->assertDatabaseHas('audit_logs', ['action' => 'org.created', 'organization_id' => $org->id, 'actor_id' => $user->id]));
    }

    public function test_duplicate_names_get_unique_slugs(): void
    {
        $user = $this->user();
        $a = $this->actingAs($user)->postJson('/api/v1/orgs', ['name' => 'Acme'])->json('data.organization.slug');
        $b = $this->postJson('/api/v1/orgs', ['name' => 'Acme'])->json('data.organization.slug');
        $this->assertSame('acme', $a);
        $this->assertNotSame($a, $b);
        $this->assertStringStartsWith('acme-', $b);
    }

    public function test_validation(): void
    {
        $this->actingAs($this->user());
        $this->postJson('/api/v1/orgs', [])->assertStatus(422);
        $this->postJson('/api/v1/orgs', ['name' => 'A'])->assertStatus(422);
        $this->postJson('/api/v1/orgs', ['name' => 'Acme', 'timezone' => 'Nope/Zone'])->assertStatus(422);
        $this->postJson('/api/v1/orgs', ['name' => 'Acme', 'default_currency' => 'DOLLARS'])->assertStatus(422);
    }

    public function test_user_can_belong_to_several_orgs_and_sees_role_per_org(): void
    {
        $user = $this->user();
        $mine = $this->org($user, 'Mine');
        $other = $this->org(null, 'Other');
        $this->member($other, 'analyst', $user);

        $rows = $this->actingAs($user)->getJson('/api/v1/me/organizations')->assertOk()->json('data');
        $this->assertCount(2, $rows);
        $roles = collect($rows)->mapWithKeys(fn ($r) => [$r['organization']['id'] => $r['role']['key']]);
        $this->assertSame('owner', $roles[$mine->id]);
        $this->assertSame('analyst', $roles[$other->id]);
    }

    public function test_org_addressable_by_id_or_slug(): void
    {
        $user = $this->user();
        $org = $this->org($user);
        $this->actingAs($user)->getJson("/api/v1/orgs/{$org->id}")->assertOk()->assertJsonPath('data.organization.id', $org->id);
        $this->getJson("/api/v1/orgs/{$org->slug}")->assertOk()->assertJsonPath('data.organization.id', $org->id);
    }

    public function test_non_members_get_404_not_403(): void
    {
        $org = $this->org();
        $this->actingAs($this->user())->getJson("/api/v1/orgs/{$org->id}")->assertNotFound();
        $this->getJson("/api/v1/orgs/{$org->id}/projects")->assertNotFound();
        $this->getJson('/api/v1/orgs/'.fake()->uuid())->assertNotFound();
    }

    public function test_update_requires_permission(): void
    {
        $org = $this->org();
        $admin = $this->member($org, 'admin');
        $manager = $this->member($org, 'manager');

        $this->actingAs($admin)->patchJson($this->base($org), ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.organization.name', 'Renamed');
        $this->actingAs($manager)->patchJson($this->base($org), ['name' => 'Nope'])->assertForbidden()->assertJsonPath('code', 'forbidden');
        $this->assertSame('Renamed', $org->fresh()->name);
    }

    public function test_only_owner_can_delete_and_must_confirm_password(): void
    {
        $owner = $this->user();
        $org = $this->org($owner);
        $admin = $this->member($org, 'admin');

        $this->actingAs($admin)->deleteJson($this->base($org), ['password' => 'correct-horse-battery-9'])->assertForbidden();
        $this->actingAs($owner)->deleteJson($this->base($org), ['password' => 'wrong'])->assertStatus(422);
        $this->assertNull($org->fresh()->deleted_at);

        $this->deleteJson($this->base($org), ['password' => 'correct-horse-battery-9'])->assertNoContent();
        $this->assertSoftDeleted($org);
        $this->getJson($this->base($org))->assertNotFound();
        $this->getJson('/api/v1/me/organizations')->assertJsonCount(0, 'data');
        $this->inOrg($org, fn () => $this->assertSame(1, DB::table('audit_logs')->where('action', 'org.deleted')->count()));
    }
}
