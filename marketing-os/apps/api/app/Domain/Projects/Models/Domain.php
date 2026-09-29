<?php

declare(strict_types=1);

namespace App\Domain\Projects\Models;

use App\Domain\Tenancy\Support\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Domain extends Model
{
    use BelongsToOrganization, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $casts = ['is_primary' => 'boolean', 'ownership_verified_at' => 'datetime'];

    public function website(): BelongsTo
    {
        return $this->belongsTo(Website::class);
    }
}
