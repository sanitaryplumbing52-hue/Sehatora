<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Domain\Projects\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Project */
class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'industry' => $this->industry,
            'market' => $this->market,
            'currency' => $this->currency,
            'timezone' => $this->timezone,
            'goals' => $this->goals,
            'archived' => $this->archived_at !== null,
            'websites' => WebsiteResource::collection($this->whenLoaded('websites')),
            'created_at' => $this->created_at?->toAtomString(),
            'updated_at' => $this->updated_at?->toAtomString(),
        ];
    }
}
