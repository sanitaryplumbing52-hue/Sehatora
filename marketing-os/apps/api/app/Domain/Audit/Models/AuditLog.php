<?php

declare(strict_types=1);

namespace App\Domain\Audit\Models;

use App\Domain\Audit\Audit;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Read model only. Writes go through {@see Audit}; the table is append-only. */
class AuditLog extends Model
{
    use HasUuids;

    public const UPDATED_AT = null;

    protected $guarded = [];

    protected $casts = ['metadata' => 'array', 'created_at' => 'datetime'];
}
