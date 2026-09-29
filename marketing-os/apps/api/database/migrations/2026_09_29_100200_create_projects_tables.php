<?php

use App\Support\TenantRls;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        TenantRls::createFunction();

        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('industry')->nullable();
            $table->string('market')->nullable();
            $table->char('currency', 3)->default('USD');
            $table->string('timezone', 64)->default('UTC');
            $table->jsonb('goals')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'archived_at']);
        });

        Schema::create('websites', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->string('name')->nullable();
            $table->string('url', 2048);
            $table->string('cms', 32)->default('unknown'); // unknown|wordpress|shopify|other
            $table->jsonb('crawl_settings')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'project_id']);
        });

        Schema::create('domains', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('website_id')->constrained()->cascadeOnDelete();
            $table->string('host');
            $table->boolean('is_primary')->default(false);
            $table->timestamp('ownership_verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['organization_id', 'website_id']);
        });
        // A host may be registered once per organization among live (non-deleted) rows.
        DB::statement('CREATE UNIQUE INDEX domains_org_host_unique ON domains (organization_id, host) WHERE deleted_at IS NULL');

        foreach (['projects', 'websites', 'domains'] as $t) {
            TenantRls::enable($t);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('domains');
        Schema::dropIfExists('websites');
        Schema::dropIfExists('projects');
        DB::unprepared('DROP FUNCTION IF EXISTS app_current_org()');
    }
};
