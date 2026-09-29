<?php

declare(strict_types=1);

namespace App\Domain\Projects\Models;

use App\Domain\Tenancy\Support\BelongsToOrganization;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use BelongsToOrganization, HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $casts = ['goals' => 'array', 'archived_at' => 'datetime'];

    protected static function newFactory(): ProjectFactory
    {
        return ProjectFactory::new();
    }

    public function websites(): HasMany
    {
        return $this->hasMany(Website::class);
    }
}
