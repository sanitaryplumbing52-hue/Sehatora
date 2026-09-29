<?php

declare(strict_types=1);

namespace App\Domain\Billing\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Plan extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = ['is_public' => 'boolean'];

    public function entitlements(): HasMany
    {
        return $this->hasMany(PlanEntitlement::class);
    }
}
