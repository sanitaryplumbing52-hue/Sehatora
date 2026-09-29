<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // No foreign keys on purpose: the audit trail must outlive the rows it describes.
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id')->nullable();
            $table->uuid('project_id')->nullable();
            $table->uuid('actor_id')->nullable();
            $table->string('actor_email')->nullable(); // snapshot
            $table->string('action', 96);
            $table->string('subject_type', 96)->nullable();
            $table->uuid('subject_id')->nullable();
            $table->jsonb('metadata')->nullable();     // redacted before insert
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('request_id', 64)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->index(['organization_id', 'created_at']);
            $table->index(['organization_id', 'action']);
            $table->index('actor_id');
        });

        // Append-only: reject UPDATE / DELETE at the database level.
        DB::unprepared(<<<'SQL'
        CREATE OR REPLACE FUNCTION audit_logs_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'audit_logs is append-only'; END $$;
        CREATE TRIGGER audit_logs_no_update BEFORE UPDATE OR DELETE ON audit_logs
            FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable();
        SQL);

        // Reads are tenant-scoped; org-less rows (sign-in/registration events) are not tenant data.
        // Inserts are allowed from any context.
        DB::unprepared(<<<'SQL'
        ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
        ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
        CREATE POLICY audit_read ON audit_logs FOR SELECT USING (organization_id = app_current_org() OR organization_id IS NULL);
        CREATE POLICY audit_insert ON audit_logs FOR INSERT WITH CHECK (true);
        SQL);
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS audit_logs_no_update ON audit_logs');
        DB::unprepared('DROP FUNCTION IF EXISTS audit_logs_immutable()');
        Schema::dropIfExists('audit_logs');
    }
};
