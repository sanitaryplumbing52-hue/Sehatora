<?php

declare(strict_types=1);

namespace App\Domain\Projects\Models;

use App\Domain\Tenancy\Support\BelongsToOrganization;
use Database\Factories\WebsiteFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Website extends Model
{
    use BelongsToOrganization, HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $casts = ['crawl_settings' => 'array', 'verified_at' => 'datetime'];

    protected static function newFactory(): WebsiteFactory
    {
        return WebsiteFactory::new();
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }
}
