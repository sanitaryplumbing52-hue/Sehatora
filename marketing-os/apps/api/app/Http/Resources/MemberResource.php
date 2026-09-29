<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Tenancy\Models\OrganizationUser;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin OrganizationUser */
class MemberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user_id' => $this->user_id,
            'name' => $this->user->name,
            'email' => $this->user->email,
            'role' => ['key' => $this->role->key, 'name' => $this->role->name],
            'two_factor_enabled' => $this->user->hasTwoFactorEnabled(),
            'joined_at' => $this->created_at?->toAtomString(),
        ];
    }
}
