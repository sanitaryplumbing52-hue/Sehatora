<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Identity\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified' => $this->hasVerifiedEmail(),
            'two_factor_enabled' => $this->hasTwoFactorEnabled(),
            'locale' => $this->locale,
            'timezone' => $this->timezone,
            'created_at' => $this->created_at?->toAtomString(),
        ];
    }
}
