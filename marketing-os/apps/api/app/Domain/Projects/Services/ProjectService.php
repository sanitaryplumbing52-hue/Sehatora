<?php

declare(strict_types=1);

namespace App\Domain\Projects\Services;

use App\Domain\Audit\Audit;
use App\Domain\Billing\Entitlements;
use App\Domain\Projects\Models\Project;
use App\Domain\Tenancy\Services\TenantContext;
use App\Support\DomainRuleViolation;
use Illuminate\Support\Facades\DB;

final class ProjectService
{
    public function __construct(private readonly Audit $audit, private readonly TenantContext $tenant) {}

    /** @param array<string, mixed> $data */
    public function create(array $data): Project
    {
        $org = $this->tenant->organizationOrFail();

        return DB::transaction(function () use ($org, $data) {
            DB::select('select pg_advisory_xact_lock(hashtext(?))', ['org-projects:'.$org->id]);
            if (! Entitlements::for($org)->allows('projects.max', Project::count())) {
                throw new DomainRuleViolation('Your plan\'s project limit has been reached.', 'entitlement_exceeded', 403,
                    'Archive or delete a project, or upgrade your plan.', ['feature' => 'projects.max']);
            }
            $project = Project::create($data + ['currency' => $org->default_currency, 'timezone' => $org->timezone]);
            $this->audit->record('project.created', $project, ['name' => $project->name], projectId: $project->id);

            return $project;
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Project $project, array $data): Project
    {
        $archive = $data['archived'] ?? null;
        unset($data['archived']);
        $project->fill($data);
        if ($archive !== null) {
            $project->archived_at = $archive ? ($project->archived_at ?? now()) : null;
        }
        $changed = array_keys($project->getDirty());
        $project->save();
        $action = $archive === true ? 'project.archived' : ($archive === false ? 'project.unarchived' : 'project.updated');
        $this->audit->record($action, $project, ['changed' => $changed], projectId: $project->id);

        return $project;
    }

    public function delete(Project $project): void
    {
        DB::transaction(function () use ($project) {
            $this->audit->record('project.deleted', $project, ['name' => $project->name], projectId: $project->id);
            foreach ($project->websites as $website) {
                $website->domains()->delete();
                $website->delete();
            }
            $project->delete();
        });
    }
}
