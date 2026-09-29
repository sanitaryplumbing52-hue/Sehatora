<?php

namespace Tests\Feature\Projects;

use App\Domain\Projects\Models\Domain;
use App\Domain\Projects\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ProjectsAndWebsitesTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_crud_projects_and_defaults_inherit_from_org(): void
    {
        $org = $this->org();
        $org->update(['default_currency' => 'AED', 'timezone' => 'Asia/Dubai']);
        $manager = $this->member($org, 'manager');
        $b = $this->base($org);

        $id = $this->actingAs($manager)->postJson("$b/projects", ['name' => 'Ariston UAE', 'industry' => 'Home appliances', 'goals' => ['Increase qualified leads']])
            ->assertCreated()->assertJsonPath('data.currency', 'AED')->assertJsonPath('data.timezone', 'Asia/Dubai')->json('data.id');

        $this->getJson("$b/projects/$id")->assertOk()->assertJsonPath('data.name', 'Ariston UAE')->assertJsonPath('data.goals.0', 'Increase qualified leads');
        $this->patchJson("$b/projects/$id", ['name' => 'Ariston GCC', 'currency' => 'sar'])->assertOk()->assertJsonPath('data.currency', 'SAR');
        $this->deleteJson("$b/projects/$id")->assertNoContent();
        $this->getJson("$b/projects/$id")->assertNotFound();
        $this->assertTrue($this->inOrg($org, fn () => Project::withTrashed()->findOrFail($id)->trashed()));

        $actions = $this->inOrg($org, fn () => DB::table('audit_logs')->where('project_id', $id)->pluck('action')->all());
        $this->assertEqualsCanonicalizing(['project.created', 'project.updated', 'project.deleted'], $actions);
    }

    public function test_project_validation(): void
    {
        $org = $this->org();
        $this->actingAs($org->owner)->postJson("{$this->base($org)}/projects", [])->assertStatus(422);
        $this->postJson("{$this->base($org)}/projects", ['name' => 'X'])->assertStatus(422);
        $this->postJson("{$this->base($org)}/projects", ['name' => 'Valid', 'currency' => 'US'])->assertStatus(422);
        $this->postJson("{$this->base($org)}/projects", ['name' => 'Valid', 'goals' => 'not-an-array'])->assertStatus(422);
    }

    public function test_read_only_roles_can_list_but_not_mutate(): void
    {
        $org = $this->org();
        $project = $this->inOrg($org, fn () => Project::factory()->create());
        foreach (['analyst', 'editor', 'viewer'] as $role) {
            $u = $this->member($org, $role);
            $this->actingAs($u)->getJson("{$this->base($org)}/projects")->assertOk()->assertJsonCount(1, 'data');
            $this->postJson("{$this->base($org)}/projects", ['name' => 'Nope Project'])->assertForbidden();
            $this->patchJson("{$this->base($org)}/projects/{$project->id}", ['name' => 'Hacked'])->assertForbidden();
            $this->deleteJson("{$this->base($org)}/projects/{$project->id}")->assertForbidden();
            $this->postJson("{$this->base($org)}/projects/{$project->id}/websites", ['url' => 'https://example.com'])->assertForbidden();
        }
        $this->assertSame(1, $this->inOrg($org, fn () => Project::count()));
    }

    public function test_archive_hides_from_default_list(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $id = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Old Campaign'])->json('data.id');
        $this->patchJson("$b/projects/$id", ['archived' => true])->assertOk()->assertJsonPath('data.archived', true);
        $this->getJson("$b/projects")->assertJsonCount(0, 'data');
        $this->getJson("$b/projects?archived=1")->assertJsonCount(1, 'data');
        $this->getJson("$b/projects?archived=true")->assertJsonCount(1, 'data');
        $this->getJson("$b/projects?archived=false")->assertJsonCount(0, 'data');
        $this->getJson("$b/projects?archived=maybe")->assertStatus(422);
        $this->patchJson("$b/projects/$id", ['archived' => false])->assertJsonPath('data.archived', false);
        $this->getJson("$b/projects")->assertJsonCount(1, 'data');
    }

    public function test_project_limit_comes_from_plan_entitlements(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $this->actingAs($org->owner);
        foreach (['One', 'Two', 'Three'] as $n) {
            $this->postJson("$b/projects", ['name' => "Project $n"])->assertCreated();
        }
        $this->postJson("$b/projects", ['name' => 'Project Four'])->assertForbidden()
            ->assertJsonPath('code', 'entitlement_exceeded')->assertJsonPath('feature', 'projects.max');

        $this->onPlan($org, 'starter');
        $this->postJson("$b/projects", ['name' => 'Project Four'])->assertCreated();
    }

    public function test_add_website_normalises_url_and_creates_primary_domain(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $pid = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Site Project'])->json('data.id');

        $res = $this->postJson("$b/projects/$pid/websites", ['url' => 'HTTPS://www.Example.com/some/path?x=1', 'name' => 'Main site', 'cms' => 'wordpress'])
            ->assertCreated()->assertJsonPath('data.url', 'https://www.example.com')->assertJsonPath('data.cms', 'wordpress')
            ->assertJsonPath('data.verified', false)->assertJsonPath('data.domains.0.host', 'www.example.com')
            ->assertJsonPath('data.domains.0.is_primary', true)->assertJsonPath('data.domains.0.ownership_verified', false);
        $wid = $res->json('data.id');

        $this->getJson("$b/projects/$pid")->assertJsonPath('data.websites.0.id', $wid);
        $this->getJson("$b/projects/$pid/websites/$wid")->assertOk();
        $this->patchJson("$b/projects/$pid/websites/$wid", ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.name', 'Renamed');
        $this->patchJson("$b/projects/$pid/websites/$wid", ['url' => 'https://evil.example'])->assertStatus(422);
        $this->deleteJson("$b/projects/$pid/websites/$wid")->assertNoContent();
        $this->getJson("$b/projects/$pid/websites")->assertJsonCount(0, 'data');
        $this->assertSame(0, $this->inOrg($org, fn () => Domain::count()));
    }

    public function test_invalid_website_urls_are_rejected_with_a_helpful_code(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $pid = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Site Project'])->json('data.id');
        foreach (['http://192.168.1.1', 'localhost', 'ftp://example.com', 'javascript:alert(1)', 'not a url'] as $bad) {
            $this->postJson("$b/projects/$pid/websites", ['url' => $bad])->assertStatus(422)->assertJsonPath('code', 'invalid_website_url');
        }
        $this->postJson("$b/projects/$pid/websites", [])->assertStatus(422);
        $this->assertSame(0, $this->inOrg($org, fn () => Domain::count()));
    }

    public function test_same_domain_cannot_be_added_twice_in_an_org_but_can_in_another(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $p1 = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'First Project'])->json('data.id');
        $p2 = $this->postJson("$b/projects", ['name' => 'Second Project'])->json('data.id');

        $this->postJson("$b/projects/$p1/websites", ['url' => 'https://example.com'])->assertCreated();
        $this->postJson("$b/projects/$p2/websites", ['url' => 'http://EXAMPLE.com/other'])->assertStatus(422)->assertJsonPath('code', 'website_already_exists');

        $other = $this->org();
        $op = $this->actingAs($other->owner)->postJson($this->base($other).'/projects', ['name' => 'Other Org Project'])->json('data.id');
        $this->postJson($this->base($other)."/projects/$op/websites", ['url' => 'https://example.com'])->assertCreated();
    }

    public function test_domain_can_be_re_added_after_website_deletion(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $pid = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Site Project'])->json('data.id');
        $w = $this->postJson("$b/projects/$pid/websites", ['url' => 'https://example.com'])->json('data.id');
        $this->deleteJson("$b/projects/$pid/websites/$w")->assertNoContent();
        $this->postJson("$b/projects/$pid/websites", ['url' => 'https://example.com'])->assertCreated();
    }

    public function test_website_per_project_limit(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $pid = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Site Project'])->json('data.id');
        foreach (['a', 'b', 'c'] as $h) {
            $this->postJson("$b/projects/$pid/websites", ['url' => "https://$h.example.com"])->assertCreated();
        }
        $this->postJson("$b/projects/$pid/websites", ['url' => 'https://d.example.com'])->assertForbidden()->assertJsonPath('feature', 'websites.per_project.max');
    }

    public function test_deleting_a_project_removes_its_websites_and_frees_domains(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $pid = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Site Project'])->json('data.id');
        $this->postJson("$b/projects/$pid/websites", ['url' => 'https://example.com'])->assertCreated();
        $this->deleteJson("$b/projects/$pid")->assertNoContent();
        $this->assertSame(0, $this->inOrg($org, fn () => Domain::count()));
        $p2 = $this->postJson("$b/projects", ['name' => 'Replacement'])->json('data.id');
        $this->postJson("$b/projects/$p2/websites", ['url' => 'https://example.com'])->assertCreated();
    }

    public function test_website_must_belong_to_the_project_in_the_url(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $p1 = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'First Project'])->json('data.id');
        $p2 = $this->postJson("$b/projects", ['name' => 'Second Project'])->json('data.id');
        $w = $this->postJson("$b/projects/$p1/websites", ['url' => 'https://example.com'])->json('data.id');
        $this->getJson("$b/projects/$p2/websites/$w")->assertNotFound();
        $this->deleteJson("$b/projects/$p2/websites/$w")->assertNotFound();
    }
}
