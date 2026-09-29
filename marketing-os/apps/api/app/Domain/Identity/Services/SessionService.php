<?php

declare(strict_types=1);

namespace App\Domain\Identity\Services;

use App\Domain\Identity\Models\User;
use Illuminate\Support\Facades\DB;

/** Device / session management on top of the database session driver. */
final class SessionService
{
    /** @return list<array<string, mixed>> */
    public function list(User $user, string $currentSessionId): array
    {
        return DB::table('sessions')->where('user_id', $user->id)->orderByDesc('last_activity')->get()
            ->map(fn ($s) => [
                'id' => $s->id === $currentSessionId ? 'current' : $this->publicId($s->id),
                'is_current' => $s->id === $currentSessionId,
                'ip_address' => $s->ip_address,
                'user_agent' => $s->user_agent,
                'last_active_at' => date(DATE_ATOM, (int) $s->last_activity),
            ])->all();
    }

    public function revoke(User $user, string $publicId): bool
    {
        $row = DB::table('sessions')->where('user_id', $user->id)->get()
            ->first(fn ($s) => hash_equals($this->publicId($s->id), $publicId));

        return $row !== null && DB::table('sessions')->where('id', $row->id)->delete() > 0;
    }

    public function revokeOthers(User $user, string $currentSessionId): void
    {
        DB::table('sessions')->where('user_id', $user->id)->where('id', '!=', $currentSessionId)->delete();
    }

    /** Session IDs are credentials; expose only a keyed hash of them. */
    private function publicId(string $sessionId): string
    {
        return substr(hash_hmac('sha256', $sessionId, (string) config('app.key')), 0, 24);
    }
}
