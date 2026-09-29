<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Orgs;

use App\Domain\Audit\Models\AuditLog;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'action' => ['sometimes', 'string', 'max:96'],
            'actor_id' => ['sometimes', 'uuid'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $page = AuditLog::query()
            ->where('organization_id', $request->attributes->get('organization')->id)
            ->when($filters['action'] ?? null, fn ($q, $a) => $q->where('action', 'like', addcslashes($a, '%_\\').'%'))
            ->when($filters['actor_id'] ?? null, fn ($q, $a) => $q->where('actor_id', $a))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->cursorPaginate($filters['per_page'] ?? 25);

        return response()->json([
            'data' => collect($page->items())->map(fn (AuditLog $l) => [
                'id' => $l->id, 'action' => $l->action, 'actor_id' => $l->actor_id, 'actor_email' => $l->actor_email,
                'subject_type' => $l->subject_type, 'subject_id' => $l->subject_id, 'project_id' => $l->project_id,
                'metadata' => $l->metadata, 'ip_address' => $l->ip_address, 'request_id' => $l->request_id,
                'created_at' => $l->created_at->toAtomString(),
            ]),
            'meta' => ['next_cursor' => $page->nextCursor()?->encode()],
        ]);
    }
}
