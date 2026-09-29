<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Support;

use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Services\TenantContext;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Application-level tenant isolation (layer 3 of 5; Postgres RLS is layer 4).
 * With no active tenant context, queries match nothing (fail closed).
 */
trait BelongsToOrganization
{
    protected static function bootBelongsToOrganization(): void
    {
        static::addGlobalScope('organization', function (Builder $builder) {
            $builder->where(
                $builder->getModel()->getTable().'.organization_id',
                app(TenantContext::class)->id() ?? '00000000-0000-0000-0000-000000000000',
            );
        });

        static::creating(function ($model) {
            $model->organization_id ??= app(TenantContext::class)->id();
        });
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
