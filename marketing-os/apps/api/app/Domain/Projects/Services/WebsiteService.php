<?php

declare(strict_types=1);

namespace App\Domain\Projects\Services;

use App\Domain\Audit\Audit;
use App\Domain\Billing\Entitlements;
use App\Domain\Projects\Models\Domain;
use App\Domain\Projects\Models\Project;
use App\Domain\Projects\Models\Website;
use App\Domain\Projects\Support\WebsiteUrl;
use App\Domain\Tenancy\Services\TenantContext;
use App\Support\DomainRuleViolation;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class WebsiteService
{
    public function __construct(private readonly Audit $audit, private readonly TenantContext $tenant) {}

    /** @param array{url: string, name?: ?string, cms?: ?string} $data */
    public function create(Project $project, array $data): Website
    {
        try {
            $url = WebsiteUrl::parse($data['url']);
        } catch (InvalidArgumentException $e) {
            throw new DomainRuleViolation($e->getMessage(), 'invalid_website_url');
        }
        $org = $this->tenant->organizationOrFail();

        return DB::transaction(function () use ($project, $data, $url, $org) {
            DB::select('select pg_advisory_xact_lock(hashtext(?))', ['org-domains:'.$org->id]);

            if (Domain::where('host', $url->host)->exists()) {
                throw new DomainRuleViolation('This website is already added to your organization.', 'website_already_exists', 422,
                    'Each domain can be added once per organization.');
            }
            if (! Entitlements::for($org)->allows('websites.per_project.max', $project->websites()->count())) {
                throw new DomainRuleViolation('Your plan\'s websites-per-project limit has been reached.', 'entitlement_exceeded', 403,
                    null, ['feature' => 'websites.per_project.max']);
            }

            $website = Website::create([
                'project_id' => $project->id,
                'url' => $url->origin(),
                'name' => $data['name'] ?? null,
                'cms' => $data['cms'] ?? 'unknown',
            ]);
            $website->domains()->create(['host' => $url->host, 'is_primary' => true]);
            $this->audit->record('website.created', $website, ['url' => $website->url], projectId: $project->id);

            return $website->load('domains');
        });
    }

    /** @param array<string, mixed> $data */
    public function update(Website $website, array $data): Website
    {
        $website->fill($data)->save();
        $this->audit->record('website.updated', $website, ['changed' => array_keys($website->getChanges())], projectId: $website->project_id);

        return $website->load('domains');
    }

    public function delete(Website $website): void
    {
        DB::transaction(function () use ($website) {
            $this->audit->record('website.deleted', $website, ['url' => $website->url], projectId: $website->project_id);
            $website->domains()->delete();
            $website->delete();
        });
    }
}
