<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Orgs;

use App\Domain\Tenancy\Models\Invitation;
use App\Domain\Tenancy\Models\Role;
use App\Domain\Tenancy\Services\InvitationService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Orgs\InviteMemberRequest;
use App\Http\Resources\InvitationResource;
use App\Http\Resources\MembershipResource;
use App\Support\Problem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvitationController extends Controller
{
    public function __construct(private readonly InvitationService $invitations) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return InvitationResource::collection(
            Invitation::with('role')->where('organization_id', $request->attributes->get('organization')->id)->pending()->latest()->get(),
        );
    }

    public function store(InviteMemberRequest $request): JsonResponse
    {
        $invitation = $this->invitations->invite(
            $request->attributes->get('organization'), $request->attributes->get('membership')->load(['role', 'user']),
            $request->validated('email'), Role::byKey($request->validated('role')),
        );

        return (new InvitationResource($invitation->load('role')))->response()->setStatusCode(201);
    }

    public function destroy(Request $request, string $invitation): \Illuminate\Http\Response|JsonResponse
    {
        $model = Invitation::where('organization_id', $request->attributes->get('organization')->id)->pending()->find($invitation);
        if (! $model) {
            return Problem::response(404, 'not_found', 'Resource not found.');
        }
        $this->invitations->revoke($model);

        return response()->noContent();
    }

    /** Not org-scoped: the invitee is not yet a member. */
    public function accept(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:128']]);
        $membership = $this->invitations->accept($request->user(), $data['token']);

        return (new MembershipResource($membership))->response()->setStatusCode(200);
    }
}
