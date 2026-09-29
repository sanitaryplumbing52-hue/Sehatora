<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Domain\Projects\Models\Website */
class WebsiteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'name' => $this->name,
            'url' => $this->url,
            'cms' => $this->cms,
            'verified' => $this->verified_at !== null,
            'domains' => $this->whenLoaded('domains', fn () => $this->domains->map(fn ($d) => [
                'id' => $d->id, 'host' => $d->host, 'is_primary' => $d->is_primary,
                'ownership_verified' => $d->ownership_verified_at !== null,
            ])),
            'created_at' => $this->created_at?->toAtomString(),
        ];
    }
}
