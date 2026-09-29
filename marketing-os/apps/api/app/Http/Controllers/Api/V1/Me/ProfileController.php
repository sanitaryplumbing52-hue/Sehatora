<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Me;

use App\Domain\Audit\Audit;
use App\Domain\Identity\Models\LoginActivity;
use App\Domain\Identity\Services\SessionService;
use App\Domain\Identity\Services\TwoFactorService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\MembershipResource;
use App\Http\Resources\UserResource;
use App\Support\Problem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class ProfileController extends Controller
{
    public function show(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    public function update(Request $request, Audit $audit): UserResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'min:1', 'max:120'],
            'locale' => ['sometimes', 'string', 'in:en,ar'],
            'timezone' => ['sometimes', 'timezone:all'],
        ]);
        $request->user()->update($data);
        $audit->record('me.profile_updated', $request->user(), ['changed' => array_keys($data)]);

        return new UserResource($request->user());
    }

    public function updatePassword(Request $request, SessionService $sessions, Audit $audit): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', RegisterRequest::passwordRule(), 'different:current_password'],
        ]);
        $request->user()->update(['password' => $data['password']]);
        $sessions->revokeOthers($request->user(), $request->session()->getId());
        $audit->record('me.password_changed', $request->user());

        return response()->json(['message' => 'Password updated. Other devices were signed out.']);
    }

    public function sessions(Request $request, SessionService $sessions): JsonResponse
    {
        return response()->json(['data' => $sessions->list($request->user(), $request->session()->getId())]);
    }

    public function revokeSession(Request $request, SessionService $sessions, Audit $audit, string $id): Response|JsonResponse
    {
        if ($id === 'current' || ! $sessions->revoke($request->user(), $id)) {
            return Problem::response(404, 'not_found', 'Resource not found.');
        }
        $audit->record('me.session_revoked', $request->user());

        return response()->noContent();
    }

    public function loginActivity(Request $request): JsonResponse
    {
        $rows = LoginActivity::where('user_id', $request->user()->id)->orWhere('email', $request->user()->email)
            ->latest('created_at')->limit(50)->get()
            ->map(fn ($a) => [
                'id' => $a->id, 'outcome' => $a->outcome, 'ip_address' => $a->ip_address,
                'user_agent' => $a->user_agent, 'created_at' => $a->created_at->toAtomString(),
            ]);

        return response()->json(['data' => $rows]);
    }

    /** All organizations the user belongs to, with their role and permissions in each. */
    public function organizations(Request $request): AnonymousResourceCollection
    {
        $memberships = $request->user()->memberships()
            ->whereHas('organization')->with(['organization', 'role.permissions'])->get()
            ->sortBy(fn ($m) => $m->organization->name)->values();

        return MembershipResource::collection($memberships);
    }

    public function twoFactorEnable(Request $request, TwoFactorService $twoFactor, Audit $audit): JsonResponse
    {
        $request->validate(['password' => ['required', 'current_password']]);
        $audit->record('me.two_factor_enrolment_started', $request->user());

        return response()->json(['data' => $twoFactor->beginEnrolment($request->user())]);
    }

    public function twoFactorConfirm(Request $request, TwoFactorService $twoFactor, Audit $audit): JsonResponse
    {
        $data = $request->validate(['code' => ['required', 'string']]);
        $codes = $twoFactor->confirmEnrolment($request->user(), $data['code']);
        if ($codes === null) {
            return Problem::response(422, 'invalid_two_factor_code', 'That code is not valid.', null,
                ['errors' => ['code' => ['That code is not valid.']]]);
        }
        $audit->record('me.two_factor_enabled', $request->user());

        return response()->json(['data' => ['recovery_codes' => $codes]]);
    }

    public function twoFactorDisable(Request $request, TwoFactorService $twoFactor, Audit $audit): Response
    {
        $request->validate(['password' => ['required', 'current_password']]);
        $twoFactor->disable($request->user());
        $audit->record('me.two_factor_disabled', $request->user());

        return response()->noContent();
    }
}
