<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Projects;

use App\Domain\Projects\Models\Project;
use App\Domain\Projects\Models\Website;
use App\Domain\Projects\Services\WebsiteService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\WebsiteRequest;
use App\Http\Resources\WebsiteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class WebsiteController extends Controller
{
    public function __construct(private readonly WebsiteService $websites) {}

    public function index(Project $project): AnonymousResourceCollection
    {
        return WebsiteResource::collection($project->websites()->with('domains')->orderBy('created_at')->get());
    }

    public function store(WebsiteRequest $request, Project $project): JsonResponse
    {
        return (new WebsiteResource($this->websites->create($project, $request->validated())))->response()->setStatusCode(201);
    }

    public function show(Project $project, Website $website): WebsiteResource
    {
        abort_unless($website->project_id === $project->id, 404);

        return new WebsiteResource($website->load('domains'));
    }

    public function update(WebsiteRequest $request, Project $project, Website $website): WebsiteResource
    {
        abort_unless($website->project_id === $project->id, 404);

        return new WebsiteResource($this->websites->update($website, $request->validated()));
    }

    public function destroy(Project $project, Website $website): Response
    {
        abort_unless($website->project_id === $project->id, 404);
        $this->websites->delete($website);

        return response()->noContent();
    }
}
