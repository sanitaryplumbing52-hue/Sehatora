<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Services;

use App\Domain\Audit\Audit;
use App\Domain\Tenancy\Models\OrganizationUser;
use App\Domain\Tenancy\Models\Role;
use App\Support\DomainRuleViolation;
use Illuminate\Support\Facades\DB;

/**
 * Membership rules: you can only manage members at or below your own level and
 * only assign roles at or below your own level; an organization always keeps
 * at least one Owner.
 */
final class MemberService
{
    public function __construct(private readonly Audit $audit) {}

    public function changeRole(OrganizationUser $actor, OrganizationUser $target, Role $newRole): OrganizationUser
    {
        $this->assertCanManage($actor, $target);
        if ($newRole->rank < $actor->role->rank) {
            throw new DomainRuleViolation('You cannot assign a role above your own.', 'role_escalation', 403);
        }

        return DB::transaction(function () use ($target, $newRole) {
            $this->lockOrg($target->organization_id);
            if ($target->role->key === 'owner' && $newRole->key !== 'owner') {
                $this->assertNotLastOwner($target);
            }
            $old = $target->role->key;
            $target->update(['role_id' => $newRole->id]);
            $this->audit->record('org.member.role_changed', $target, ['from' => $old, 'to' => $newRole->key, 'member_id' => $target->user_id]);

            return $target->load('role');
        });
    }

    public function remove(OrganizationUser $actor, OrganizationUser $target): void
    {
        $this->assertCanManage($actor, $target);
        $this->delete($target, 'org.member.removed');
    }

    public function leave(OrganizationUser $member): void
    {
        $this->delete($member, 'org.member.left');
    }

    private function delete(OrganizationUser $target, string $action): void
    {
        DB::transaction(function () use ($target, $action) {
            $this->lockOrg($target->organization_id);
            if ($target->role->key === 'owner') {
                $this->assertNotLastOwner($target);
            }
            $this->audit->record($action, $target, ['member_id' => $target->user_id, 'role' => $target->role->key]);
            $target->delete();
        });
    }

    private function assertCanManage(OrganizationUser $actor, OrganizationUser $target): void
    {
        if ($actor->role->rank > $target->role->rank) {
            throw new DomainRuleViolation('You cannot manage a member with a higher role than yours.', 'role_hierarchy', 403);
        }
    }

    private function assertNotLastOwner(OrganizationUser $target): void
    {
        $owners = OrganizationUser::where('organization_id', $target->organization_id)
            ->whereHas('role', fn ($q) => $q->where('key', 'owner'))->count();
        if ($owners <= 1) {
            throw new DomainRuleViolation('An organization must keep at least one owner.', 'last_owner', 422,
                'Promote another member to Owner first.');
        }
    }

    /** Serialise membership changes per organization so the last-owner check cannot race. */
    private function lockOrg(string $orgId): void
    {
        DB::select('select pg_advisory_xact_lock(hashtext(?))', ['org-members:'.$orgId]);
    }
}
