<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Orgs;

use App\Domain\Tenancy\Services\MemberService;
use App\Domain\Tenancy\Services\OrganizationService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orgs\StoreOrganizationRequest;
use App\Http\Requests\Orgs\UpdateOrganizationRequest;
use App\Http\Resources\MembershipResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class OrganizationController extends Controller
{
    public function __construct(private readonly OrganizationService $organizations) {}

    public function store(StoreOrganizationRequest $request): JsonResponse
    {
        $membership = $this->organizations->create($request->user(), $request->validated());

        return (new MembershipResource($membership))->response()->setStatusCode(201);
    }

    public function show(Request $request): MembershipResource
    {
        return new MembershipResource($request->attributes->get('membership')->load(['organization', 'role.permissions']));
    }

    public function update(UpdateOrganizationRequest $request): MembershipResource
    {
        $data = $request->validated();
        if (isset($data['default_currency'])) {
            $data['default_currency'] = strtoupper($data['default_currency']);
        }
        $this->organizations->update($request->attributes->get('organization'), $data);

        return new MembershipResource($request->attributes->get('membership')->load(['organization', 'role.permissions']));
    }

    public function destroy(Request $request): Response
    {
        $request->validate(['password' => ['required', 'current_password']]);
        $this->organizations->delete($request->attributes->get('organization'));

        return response()->noContent();
    }

    public function leave(Request $request, MemberService $members): Response
    {
        $members->leave($request->attributes->get('membership')->load('role'));

        return response()->noContent();
    }
}
