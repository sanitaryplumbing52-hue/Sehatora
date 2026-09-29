<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Models\OrganizationUser;
use App\Domain\Tenancy\Services\TenantContext;
use App\Support\Problem;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Resolves {org} (uuid or slug), verifies the authenticated user is a member,
 * and activates the tenant context (app layer + Postgres RLS). Non-members get
 * 404 — never 403 — so organization existence is not leaked.
 */
class ResolveOrganization
{
    public function __construct(private readonly TenantContext $tenant) {}

    public function handle(Request $request, Closure $next): Response
    {
        $organization = Organization::findByIdOrSlug((string) $request->route('org'));
        $membership = ($organization && $request->user())
            ? OrganizationUser::with('role')
                ->where('organization_id', $organization->id)
                ->where('user_id', $request->user()->id)->first()
            : null;

        if (! $organization || ! $membership) {
            return Problem::response(404, 'not_found', 'Resource not found.');
        }

        $this->tenant->set($organization, $membership);
        $request->attributes->set('organization', $organization);
        $request->attributes->set('membership', $membership);
        // Controllers get the org from request attributes; drop the raw param so it doesn't
        // shift the positional arguments Laravel passes to controller methods.
        $request->route()->forgetParameter('org');

        try {
            return $next($request);
        } finally {
            $this->tenant->clear();
        }
    }
}
