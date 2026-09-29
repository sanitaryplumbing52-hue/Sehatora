<?php

declare(strict_types=1);

namespace App\Domain\Tenancy\Services;

use App\Domain\Audit\Audit;
use App\Domain\Billing\Entitlements;
use App\Domain\Identity\Models\User;
use App\Domain\Identity\Notifications\InvitationNotification;
use App\Domain\Tenancy\Models\Invitation;
use App\Domain\Tenancy\Models\Organization;
use App\Domain\Tenancy\Models\OrganizationUser;
use App\Domain\Tenancy\Models\Role;
use App\Support\DomainRuleViolation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

final class InvitationService
{
    public function __construct(private readonly Audit $audit) {}

    public function invite(Organization $org, OrganizationUser $actor, string $email, Role $role): Invitation
    {
        $email = mb_strtolower(trim($email));
        if ($role->rank < $actor->role->rank) {
            throw new DomainRuleViolation('You cannot invite someone to a role above your own.', 'role_escalation', 403);
        }
        if (OrganizationUser::where('organization_id', $org->id)->whereHas('user', fn ($q) => $q->where('email', $email))->exists()) {
            throw new DomainRuleViolation('That person is already a member.', 'already_member');
        }

        $token = Str::random(48);
        $invitation = DB::transaction(function () use ($org, $actor, $email, $role, $token) {
            // Replace any earlier pending invite for this address.
            Invitation::where('organization_id', $org->id)->where('email', $email)->pending()->update(['revoked_at' => now()]);

            $used = OrganizationUser::where('organization_id', $org->id)->count()
                + Invitation::where('organization_id', $org->id)->pending()->count();
            if (! Entitlements::for($org)->allows('members.max', $used)) {
                throw new DomainRuleViolation('Your plan\'s member limit has been reached.', 'entitlement_exceeded', 403,
                    'Remove a member or pending invitation, or upgrade your plan.', ['feature' => 'members.max']);
            }

            $invitation = Invitation::create([
                'organization_id' => $org->id, 'email' => $email, 'role_id' => $role->id,
                'token_hash' => hash('sha256', $token), 'invited_by' => $actor->user_id,
                'expires_at' => now()->addDays((int) config('marketing.invitations.ttl_days')),
            ]);
            $this->audit->record('org.invitation.created', $invitation, ['email' => $email, 'role' => $role->key]);

            return $invitation;
        });

        Notification::route('mail', $email)->notify(new InvitationNotification($org->name, $actor->user->name, $role->name, $token));

        return $invitation;
    }

    public function revoke(Invitation $invitation): void
    {
        $invitation->update(['revoked_at' => now()]);
        $this->audit->record('org.invitation.revoked', $invitation, ['email' => $invitation->email]);
    }

    public function accept(User $user, string $token): OrganizationUser
    {
        $invitation = Invitation::with(['organization', 'role'])->pending()
            ->where('token_hash', hash('sha256', $token))->first();

        if (! $invitation || $invitation->organization === null) {
            throw new DomainRuleViolation('This invitation is invalid or has expired.', 'invalid_invitation', 422, 'Ask the organization admin to send a new one.');
        }
        if (mb_strtolower($user->email) !== $invitation->email) {
            throw new DomainRuleViolation('This invitation was sent to a different email address.', 'invitation_email_mismatch', 403,
                "Sign in as {$invitation->email} to accept it.");
        }

        return DB::transaction(function () use ($user, $invitation) {
            $membership = OrganizationUser::firstOrCreate(
                ['organization_id' => $invitation->organization_id, 'user_id' => $user->id],
                ['role_id' => $invitation->role_id, 'invited_by' => $invitation->invited_by],
            );
            $invitation->update(['accepted_at' => now()]);
            $this->audit->record('org.invitation.accepted', $invitation, ['role' => $invitation->role->key], $invitation->organization, $user);

            return $membership->load(['organization', 'role.permissions']);
        });
    }
}
