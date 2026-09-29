<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Schema for "Sign in with Google / Microsoft" (not wired to any route yet — see docs/security).
     * Distinct from *integration* OAuth (GA4, Ads, ...) which will use integration_tokens in Phase 2+.
     */
    public function up(): void
    {
        Schema::create('oauth_identities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32); // google | microsoft
            $table->string('provider_user_id');
            $table->string('email')->nullable();
            $table->timestamps();
            $table->unique(['provider', 'provider_user_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oauth_identities');
    }
};
