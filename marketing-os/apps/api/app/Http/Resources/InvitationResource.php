<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Tenancy\Models\Invitation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Invitation */
class InvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'role' => ['key' => $this->role->key, 'name' => $this->role->name],
            'expires_at' => $this->expires_at->toAtomString(),
            'created_at' => $this->created_at?->toAtomString(),
        ];
    }
}
