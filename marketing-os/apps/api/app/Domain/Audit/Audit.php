<?php

declare(strict_types=1);

namespace App\Domain\Audit;

use App\Domain\Identity\Models\User;
use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Services\TenantContext;
use App\Support\IpAnonymizer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Writes append-only audit records. Use dotted action names, e.g. `auth.login`,
 * `org.member.role_changed`, `project.created`. Metadata is redacted on the way in.
 */
final class Audit
{
    private const SENSITIVE = '/pass(word)?|token|secret|authorization|cookie|recovery|otp|code|key/i';

    public function __construct(private readonly TenantContext $tenant) {}

    /** @param array<string, mixed> $metadata */
    public function record(
        string $action,
        ?Model $subject = null,
        array $metadata = [],
        ?Organization $organization = null,
        ?User $actor = null,
        ?string $projectId = null,
        ?string $actorEmail = null,
    ): void {
        $request = app()->bound('request') ? request() : null;
        $actor ??= auth()->user();
        $organization ??= $this->tenant->organization();

        DB::table('audit_logs')->insert([
            'id' => (string) Str::uuid7(),
            'organization_id' => $organization?->id,
            'project_id' => $projectId,
            'actor_id' => $actor?->getKey(),
            'actor_email' => $actor?->email ?? $actorEmail,
            'action' => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->getKey(),
            'metadata' => $metadata === [] ? null : json_encode(self::redact($metadata)),
            'ip_address' => IpAnonymizer::apply($request?->ip()),
            'user_agent' => $request ? Str::limit((string) $request->userAgent(), 500, '') : null,
            'request_id' => $request?->attributes->get('request_id'),
            'created_at' => now(),
        ]);
    }

    /** @param array<mixed> $data @return array<mixed> */
    public static function redact(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_string($key) && preg_match(self::SENSITIVE, $key)) {
                $data[$key] = '[redacted]';
            } elseif (is_array($value)) {
                $data[$key] = self::redact($value);
            }
        }

        return $data;
    }
}
