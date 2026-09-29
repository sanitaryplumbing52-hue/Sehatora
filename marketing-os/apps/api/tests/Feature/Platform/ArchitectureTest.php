<?php

namespace Tests\Feature\Platform;

use App\Domain\Identity\Models\User;
use App\Domain\Projects\Models\Domain;
use App\Domain\Projects\Models\Project;
use App\Domain\Projects\Models\Website;
use App\Domain\Tenancy\Models\Invitation;
use App\Domain\Tenancy\Support\BelongsToOrganization;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Finder\Finder;
use Tests\TestCase;

/** Executable versions of the rules in docs/architecture: layering and tenant-safety invariants. */
class ArchitectureTest extends TestCase
{
    use RefreshDatabase;

    /** Tenant tables that intentionally rely on app-layer scoping, each with the reason. */
    private const NO_RLS_ALLOWLIST = [
        'organization_users' => 'membership is looked up by user_id before any tenant context exists',
        'invitations' => 'accepted by token before the invitee is a member; token hash is the credential',
        'subscriptions' => 'read by the entitlement service and written at org creation, before context is set',
    ];

    public function test_every_table_with_organization_id_is_protected_by_forced_rls_unless_allowlisted(): void
    {
        $tables = DB::select(<<<'SQL'
            SELECT c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = current_schema()
            WHERE c.relkind = 'r' AND EXISTS (
                SELECT 1 FROM information_schema.columns col
                WHERE col.table_schema = current_schema() AND col.table_name = c.relname AND col.column_name = 'organization_id'
            )
        SQL);

        $this->assertNotEmpty($tables);
        $unprotected = [];
        foreach ($tables as $t) {
            if (isset(self::NO_RLS_ALLOWLIST[$t->name])) {
                continue;
            }
            if (! $t->rls || ! $t->forced) {
                $unprotected[] = $t->name;
            }
        }
        $this->assertSame([], $unprotected, 'Tenant tables without FORCE ROW LEVEL SECURITY — add TenantRls::enable() or allowlist with a reason.');
    }

    public function test_tenant_models_use_the_organization_scope(): void
    {
        $tenantModels = [Project::class, Website::class, Domain::class];
        foreach ($tenantModels as $model) {
            $this->assertContains(BelongsToOrganization::class, class_uses_recursive($model), $model);
        }
    }

    public function test_controllers_do_not_touch_the_database_or_http_clients_directly(): void
    {
        $offenders = [];
        foreach ((new Finder)->files()->in(app_path('Http/Controllers'))->name('*.php') as $file) {
            $src = $file->getContents();
            foreach (['DB::', 'Illuminate\\Support\\Facades\\DB', 'Http::', 'Illuminate\\Support\\Facades\\Http', 'Illuminate\\Support\\Facades\\Storage'] as $needle) {
                if (str_contains($src, $needle)) {
                    $offenders[] = $file->getRelativePathname()." uses {$needle}";
                }
            }
        }
        $this->assertSame([], $offenders, 'Controllers must delegate to services (Controller -> Service -> Domain -> Model).');
    }

    public function test_only_the_audit_service_writes_audit_logs_and_only_integrations_call_external_http(): void
    {
        $offenders = [];
        foreach ((new Finder)->files()->in(app_path())->name('*.php') as $file) {
            $src = $file->getContents();
            $rel = $file->getRelativePathname();
            if (str_contains($src, "table('audit_logs')") && $rel !== 'Domain/Audit/Audit.php' && ! str_contains($rel, 'Audit/')) {
                if (! str_contains($rel, 'AuditLogController') && ! str_contains($rel, 'Audit/Models')) {
                    $offenders[] = "$rel writes audit_logs";
                }
            }
            if (preg_match('/\bHttp::(get|post|put|patch|delete|withHeaders|withToken|send)\b|new\s+\\\\?GuzzleHttp/', $src) && ! str_starts_with($rel, 'Domain/Integrations/')) {
                $offenders[] = "$rel calls external HTTP outside Domain/Integrations";
            }
        }
        $this->assertSame([], $offenders);
    }

    public function test_no_debug_helpers_or_env_calls_outside_config(): void
    {
        $offenders = [];
        foreach ((new Finder)->files()->in(app_path())->name('*.php') as $file) {
            $src = $file->getContents();
            if (preg_match('/\b(dd|dump|var_dump|ray)\s*\(/', $src)) {
                $offenders[] = $file->getRelativePathname().' has a debug call';
            }
            if (preg_match('/\benv\s*\(/', $src)) {
                $offenders[] = $file->getRelativePathname().' calls env() outside config/';
            }
        }
        $this->assertSame([], $offenders);
    }

    public function test_secrets_are_hidden_or_encrypted_on_models(): void
    {
        $user = new User;
        foreach (['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'] as $attr) {
            $this->assertContains($attr, $user->getHidden());
        }
        $casts = $user->getCasts();
        $this->assertSame('encrypted', $casts['two_factor_secret']);
        $this->assertSame('encrypted:array', $casts['two_factor_recovery_codes']);
        $this->assertContains('token_hash', (new Invitation)->getHidden());
    }
}
