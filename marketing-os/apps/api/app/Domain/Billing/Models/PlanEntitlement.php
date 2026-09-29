<?php

declare(strict_types=1);

namespace App\Domain\Billing\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PlanEntitlement extends Model
{
    use HasUuids;

    protected $guarded = [];

    protected $casts = ['enabled' => 'boolean', 'limit_value' => 'integer'];
}
