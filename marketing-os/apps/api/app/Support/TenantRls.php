<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Postgres row-level security helper. Tenant tables are protected by a policy
 * comparing organization_id with the per-connection setting `app.current_org`.
 * FORCE makes the policy apply to the table owner too, so the application role
 * can never bypass it by accident. With no org context set, no rows are visible.
 */
final class TenantRls
{
    public static function createFunction(): void
    {
        DB::unprepared(<<<'SQL'
        CREATE OR REPLACE FUNCTION app_current_org() RETURNS uuid
        LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.current_org', true), '')::uuid $$;
        SQL);
    }

    public static function enable(string $table): void
    {
        DB::unprepared(<<<SQL
        ALTER TABLE {$table} ENABLE ROW LEVEL SECURITY;
        ALTER TABLE {$table} FORCE ROW LEVEL SECURITY;
        CREATE POLICY tenant_isolation ON {$table}
            USING (organization_id = app_current_org())
            WITH CHECK (organization_id = app_current_org());
        SQL);
    }

    public static function disable(string $table): void
    {
        DB::unprepared("DROP POLICY IF EXISTS tenant_isolation ON {$table}");
        DB::unprepared("ALTER TABLE {$table} NO FORCE ROW LEVEL SECURITY");
        DB::unprepared("ALTER TABLE {$table} DISABLE ROW LEVEL SECURITY");
    }
}
