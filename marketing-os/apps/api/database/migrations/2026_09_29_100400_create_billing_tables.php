<?php

use App\Domain\Billing\PlanCatalog;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('key', 32)->unique();
            $table->string('name');
            $table->boolean('is_public')->default(true);
            $table->timestamps();
        });

        // One row per (plan, feature). type=flag uses `enabled`; type=limit uses `limit_value` (null = unlimited).
        Schema::create('plan_entitlements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
            $table->string('feature', 64);
            $table->string('type', 8);
            $table->boolean('enabled')->default(true);
            $table->bigInteger('limit_value')->nullable();
            $table->timestamps();
            $table->unique(['plan_id', 'feature']);
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained()->restrictOnDelete();
            $table->string('status', 24)->default('active'); // active|trialing|past_due|canceled
            $table->timestamp('current_period_end')->nullable();
            $table->string('external_id')->nullable(); // billing-provider reference (Phase 10)
            $table->timestamps();
            $table->index(['organization_id', 'status']);
        });

        (new PlanCatalog)->sync();
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plan_entitlements');
        Schema::dropIfExists('plans');
    }
};
