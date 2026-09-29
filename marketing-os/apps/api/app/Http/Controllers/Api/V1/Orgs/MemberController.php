<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Orgs;

use App\Domain\Tenancy\Models\OrganizationUser;
use App\Domain\Tenancy\Models\Role;
use App\Domain\Tenancy\Services\MemberService;
use App\Http\Controllers\Controller;
use App\Http\Resources\MemberResource;
use App\Support\Problem;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MemberController extends Controller
{
    public function __construct(private readonly MemberService $members) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $rows = OrganizationUser::with(['user', 'role'])
            ->where('organization_id', $request->attributes->get('organization')->id)
            ->get()->sortBy(fn ($m) => [$m->role->rank, $m->user->name])->values();

        return MemberResource::collection($rows);
    }

    public function update(Request $request, string $user): MemberResource|\Illuminate\Http\JsonResponse
    {
        $data = $request->validate(['role' => ['required', 'string', 'exists:roles,key']]);
        $target = $this->target($request, $user);
        if (! $target) {
            return Problem::response(404, 'not_found', 'Resource not found.');
        }
        $updated = $this->members->changeRole($request->attributes->get('membership'), $target, Role::byKey($data['role']));

        return new MemberResource($updated->load('user'));
    }

    public function destroy(Request $request, string $user): Response|\Illuminate\Http\JsonResponse
    {
        $target = $this->target($request, $user);
        if (! $target) {
            return Problem::response(404, 'not_found', 'Resource not found.');
        }
        $this->members->remove($request->attributes->get('membership'), $target);

        return response()->noContent();
    }

    private function target(Request $request, string $userId): ?OrganizationUser
    {
        return OrganizationUser::with('role')
            ->where('organization_id', $request->attributes->get('organization')->id)
            ->where('user_id', $userId)->first();
    }
}
