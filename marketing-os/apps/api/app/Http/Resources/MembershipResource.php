<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** The signed-in user's view of an organization: the org, their role and effective permissions. @mixin \App\Domain\Tenancy\Models\OrganizationUser */
class MembershipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'organization' => [
                'id' => $this->organization->id,
                'name' => $this->organization->name,
                'slug' => $this->organization->slug,
                'timezone' => $this->organization->timezone,
                'default_currency' => $this->organization->default_currency,
                'created_at' => $this->organization->created_at?->toAtomString(),
            ],
            'role' => ['key' => $this->role->key, 'name' => $this->role->name],
            'permissions' => $this->role->permissions->pluck('key')->sort()->values(),
        ];
    }
}
