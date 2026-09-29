<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Orgs;

use App\Domain\Tenancy\Models\Role;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class RoleController extends Controller
{
    public function index(): JsonResponse
    {
        $roles = Role::with('permissions')->orderBy('rank')->get()->map(fn ($r) => [
            'key' => $r->key, 'name' => $r->name, 'description' => $r->description, 'rank' => $r->rank,
            'permissions' => $r->permissions->pluck('key')->sort()->values(),
        ]);

        return response()->json(['data' => $roles]);
    }
}
