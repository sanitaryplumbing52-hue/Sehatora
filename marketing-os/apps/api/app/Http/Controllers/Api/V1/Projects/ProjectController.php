<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Projects;

use App\Domain\Projects\Models\Project;
use App\Domain\Projects\Services\ProjectService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\ProjectRequest;
use App\Http\Resources\ProjectResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProjectController extends Controller
{
    public function __construct(private readonly ProjectService $projects) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->validate(['archived' => ['sometimes', 'boolean'], 'per_page' => ['sometimes', 'integer', 'min:1', 'max:100']]);

        return ProjectResource::collection(
            Project::with('websites.domains')
                ->when(! ($filters['archived'] ?? false), fn ($q) => $q->whereNull('archived_at'))
                ->orderBy('name')->paginate($filters['per_page'] ?? 25),
        );
    }

    public function store(ProjectRequest $request): JsonResponse
    {
        return (new ProjectResource($this->projects->create($request->validated())))->response()->setStatusCode(201);
    }

    public function show(Project $project): ProjectResource
    {
        return new ProjectResource($project->load('websites.domains'));
    }

    public function update(ProjectRequest $request, Project $project): ProjectResource
    {
        return new ProjectResource($this->projects->update($project, $request->validated())->load('websites.domains'));
    }

    public function destroy(Project $project): Response
    {
        $this->projects->delete($project);

        return response()->noContent();
    }
}
