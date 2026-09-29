<?php

namespace Tests\Feature\Platform;

use App\Domain\Analytics\MetricRegistry;
use App\Domain\Billing\Entitlements;
use App\Domain\Projects\Models\Project;
use App\Providers\AppServiceProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class PlatformTest extends TestCase
{
    use RefreshDatabase;

    // --- Health -------------------------------------------------------------
    public function test_public_health_is_coarse_and_leaks_nothing(): void
    {
        $res = $this->getJson('/api/v1/system/health')->assertOk()->assertExactJson(['status' => 'ok']);
        $this->assertStringNotContainsString('database', $res->getContent());
    }

    public function test_health_details_require_the_token(): void
    {
        config(['marketing.health.token' => '']);
        $this->getJson('/api/v1/system/health/details')->assertNotFound();

        config(['marketing.health.token' => 'ops-secret']);
        $this->getJson('/api/v1/system/health/details')->assertNotFound();
        $this->withToken('wrong')->getJson('/api/v1/system/health/details')->assertNotFound();

        $res = $this->withToken('ops-secret')->getJson('/api/v1/system/health/details')->assertOk()->assertJsonPath('status', 'ok');
        foreach (['database', 'cache', 'queue', 'storage'] as $check) {
            $res->assertJsonPath("checks.$check.status", 'ok');
        }
        $res->assertJsonPath('checks.external_apis.status', 'not_applicable');
    }

    // --- Dashboard: no fake data ---------------------------------------------
    public function test_new_project_dashboard_contains_no_numbers_only_not_connected_envelopes(): void
    {
        $org = $this->org();
        $project = $this->inOrg($org, fn () => Project::factory()->create());
        $res = $this->actingAs($org->owner)->getJson("{$this->base($org)}/projects/{$project->id}/dashboard/overview")->assertOk();

        $metrics = $res->json('data.metrics');
        $this->assertCount(count(MetricRegistry::OVERVIEW), $metrics);
        foreach ($metrics as $m) {
            $this->assertSame('not_connected', $m['status'], $m['key']);
            $this->assertNull($m['value'], $m['key']);
            $this->assertNull($m['comparison']);
            $this->assertNull($m['last_synced_at']);
            $this->assertNotEmpty($m['calculation']);
            $this->assertSame("/{$org->slug}/integrations", $m['action']['href']);
        }
        $onboarding = collect($res->json('data.onboarding'))->keyBy('key');
        $this->assertFalse($onboarding['website']['done']);
        $this->assertFalse($onboarding['google_ads']['done']);
    }

    public function test_dashboard_onboarding_reflects_added_website(): void
    {
        $org = $this->org();
        $b = $this->base($org);
        $pid = $this->actingAs($org->owner)->postJson("$b/projects", ['name' => 'Fresh Project'])->json('data.id');
        $this->postJson("$b/projects/$pid/websites", ['url' => 'https://example.com'])->assertCreated();
        $done = collect($this->getJson("$b/projects/$pid/dashboard/overview")->json('data.onboarding'))->firstWhere('key', 'website')['done'];
        $this->assertTrue($done);
    }

    public function test_integration_catalog_reports_everything_not_connected(): void
    {
        $org = $this->org();
        $rows = $this->actingAs($org->owner)->getJson("{$this->base($org)}/integrations")->assertOk()->json('data');
        $this->assertGreaterThanOrEqual(4, count($rows));
        foreach ($rows as $r) {
            $this->assertSame('not_connected', $r['status']);
            $this->assertFalse($r['available']);
            $this->assertStringContainsString('Phase', $r['unavailable_reason']);
        }
    }

    // --- Audit log API --------------------------------------------------------
    public function test_audit_log_requires_permission_and_records_who_did_what(): void
    {
        $org = $this->org();
        $admin = $this->member($org, 'admin');
        $b = $this->base($org);
        $this->actingAs($admin)->postJson("$b/projects", ['name' => 'Audited Project'])->assertCreated();

        $this->actingAs($this->member($org, 'manager'))->getJson("$b/audit-logs")->assertForbidden();
        $this->actingAs($this->member($org, 'viewer'))->getJson("$b/audit-logs")->assertForbidden();

        $rows = $this->actingAs($admin)->getJson("$b/audit-logs")->assertOk()->json('data');
        $created = collect($rows)->firstWhere('action', 'project.created');
        $this->assertSame($admin->email, $created['actor_email']);
        $this->assertSame($admin->id, $created['actor_id']);
        $this->assertNotNull($created['request_id']);
        $this->assertSame('Project', $created['subject_type']);
        // truncated IP policy (127.0.0.1 -> 127.0.0.0)
        $this->assertSame('127.0.0.0', $created['ip_address']);

        $filtered = $this->getJson("$b/audit-logs?action=project.")->json('data');
        $this->assertNotEmpty($filtered);
        $this->assertSame([], array_filter($filtered, fn ($r) => ! str_starts_with($r['action'], 'project.')));
    }

    public function test_audit_log_paginates_with_cursor(): void
    {
        $org = $this->org();
        $this->onPlan($org, 'professional');
        $b = $this->base($org);
        $this->actingAs($org->owner);
        for ($i = 1; $i <= 5; $i++) {
            $this->postJson("$b/projects", ['name' => "Project $i"])->assertCreated();
        }
        $page1 = $this->getJson("$b/audit-logs?per_page=3")->assertOk();
        $this->assertCount(3, $page1->json('data'));
        $cursor = $page1->json('meta.next_cursor');
        $this->assertNotNull($cursor);
        $page2 = $this->getJson("$b/audit-logs?per_page=3&cursor=$cursor")->assertOk();
        $ids = array_merge(array_column($page1->json('data'), 'id'), array_column($page2->json('data'), 'id'));
        $this->assertSame($ids, array_values(array_unique($ids)));
    }

    public function test_sensitive_values_never_reach_the_audit_log(): void
    {
        $user = $this->user(['email' => 'a@example.com']);
        $this->postJson('/api/v1/auth/login', ['email' => 'a@example.com', 'password' => 'my-secret-password-1']);
        $all = json_encode(\DB::table('audit_logs')->get());
        $this->assertStringNotContainsString('my-secret-password-1', $all);
        $this->assertNotEmpty($user);
    }

    // --- Error UX ---------------------------------------------------------------
    public function test_unhandled_exceptions_return_safe_problem_details_without_internals(): void
    {
        Route::middleware('api')->get('/api/v1/_boom', fn () => throw new \RuntimeException('SECRET-DB-PASSWORD leaked in message'));
        config(['app.debug' => false]);

        $res = $this->getJson('/api/v1/_boom')->assertStatus(500);
        $res->assertJsonPath('code', 'server_error')->assertJsonStructure(['request_id', 'detail']);
        $this->assertStringNotContainsString('SECRET-DB-PASSWORD', $res->getContent());
        $this->assertStringNotContainsString('vendor/', $res->getContent());
        $this->assertStringNotContainsString('Stack trace', $res->getContent());
    }

    public function test_request_id_is_echoed_or_generated(): void
    {
        $this->getJson('/api/v1/system/health', ['X-Request-Id' => 'abc12345-trace'])->assertHeader('X-Request-Id', 'abc12345-trace');
        $generated = $this->getJson('/api/v1/system/health', ['X-Request-Id' => '<script>'])->headers->get('X-Request-Id');
        $this->assertNotSame('<script>', $generated);
        $this->assertNotEmpty($generated);
    }

    public function test_404_and_validation_use_problem_details(): void
    {
        $this->getJson('/api/v1/nope')->assertNotFound()->assertJsonPath('code', 'not_found');
        $this->actingAs($this->user())->postJson('/api/v1/orgs', [])->assertStatus(422)
            ->assertJsonPath('code', 'validation_failed')->assertJsonStructure(['errors' => ['name']]);
    }

    // --- Data mode guard --------------------------------------------------------
    public function test_production_refuses_to_boot_in_demo_data_mode(): void
    {
        config(['marketing.data_mode' => 'demo']);
        $this->app['env'] = 'production';
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('not allowed in production');
        (new AppServiceProvider($this->app))->boot();
    }

    public function test_invalid_data_mode_is_rejected(): void
    {
        config(['marketing.data_mode' => 'fake']);
        $this->expectException(\RuntimeException::class);
        (new AppServiceProvider($this->app))->boot();
    }

    public function test_demo_mode_is_allowed_outside_production(): void
    {
        config(['marketing.data_mode' => 'demo']);
        (new AppServiceProvider($this->app))->boot();
        $this->assertTrue(true);
    }

    // --- Entitlements -------------------------------------------------------------
    public function test_entitlements_resolve_from_plan_data(): void
    {
        $org = $this->org();
        $e = Entitlements::for($org);
        $this->assertSame('free', $e->planKey());
        $this->assertSame(3, $e->limit('projects.max'));
        $this->assertTrue($e->allows('projects.max', 2));
        $this->assertFalse($e->allows('projects.max', 3));
        $this->assertSame(0, $e->limit('feature.that.does.not.exist'));
        $this->assertFalse($e->can('feature.that.does.not.exist'));

        $this->onPlan($org, 'enterprise');
        $unlimited = Entitlements::for($org);
        $this->assertNull($unlimited->limit('projects.max'));
        $this->assertTrue($unlimited->allows('projects.max', 1_000_000));
    }
}
