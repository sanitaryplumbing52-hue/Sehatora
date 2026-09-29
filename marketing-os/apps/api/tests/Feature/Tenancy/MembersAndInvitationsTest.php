<?php

namespace Tests\Feature\Tenancy;

use App\Domain\Identity\Notifications\InvitationNotification;
use App\Domain\Tenancy\Models\Invitation;
use App\Domain\Tenancy\Models\OrganizationUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class MembersAndInvitationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_members_list_is_visible_to_analyst_but_not_viewer(): void
    {
        $org = $this->org();
        $this->actingAs($this->member($org, 'analyst'))->getJson("{$this->base($org)}/members")->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs($this->member($org, 'viewer'))->getJson("{$this->base($org)}/members")->assertForbidden();
    }

    public function test_admin_can_change_roles_but_not_above_own_level_or_of_owners(): void
    {
        $owner = $this->user();
        $org = $this->org($owner);
        $admin = $this->member($org, 'admin');
        $viewer = $this->member($org, 'viewer');

        $this->actingAs($admin)->patchJson("{$this->base($org)}/members/{$viewer->id}", ['role' => 'manager'])
            ->assertOk()->assertJsonPath('data.role.key', 'manager');
        $this->patchJson("{$this->base($org)}/members/{$viewer->id}", ['role' => 'owner'])->assertForbidden()->assertJsonPath('code', 'role_escalation');
        $this->patchJson("{$this->base($org)}/members/{$owner->id}", ['role' => 'viewer'])->assertForbidden()->assertJsonPath('code', 'role_hierarchy');
        $this->deleteJson("{$this->base($org)}/members/{$owner->id}")->assertForbidden();

        $this->assertSame('manager', OrganizationUser::where('user_id', $viewer->id)->first()->role->key);
        $this->assertSame('owner', OrganizationUser::where('user_id', $owner->id)->first()->role->key);
    }

    public function test_manager_and_below_cannot_manage_members(): void
    {
        $org = $this->org();
        $target = $this->member($org, 'viewer');
        $this->actingAs($this->member($org, 'manager'))->patchJson("{$this->base($org)}/members/{$target->id}", ['role' => 'editor'])->assertForbidden();
        $this->deleteJson("{$this->base($org)}/members/{$target->id}")->assertForbidden();
    }

    public function test_last_owner_cannot_be_demoted_removed_or_leave(): void
    {
        $owner = $this->user();
        $org = $this->org($owner);

        $this->actingAs($owner)->patchJson("{$this->base($org)}/members/{$owner->id}", ['role' => 'admin'])->assertStatus(422)->assertJsonPath('code', 'last_owner');
        $this->deleteJson("{$this->base($org)}/members/{$owner->id}")->assertStatus(422)->assertJsonPath('code', 'last_owner');
        $this->postJson("{$this->base($org)}/leave")->assertStatus(422)->assertJsonPath('code', 'last_owner');

        $second = $this->member($org, 'owner');
        $this->postJson("{$this->base($org)}/leave")->assertNoContent();
        $this->assertDatabaseMissing('organization_users', ['user_id' => $owner->id, 'organization_id' => $org->id]);
        $this->assertDatabaseHas('organization_users', ['user_id' => $second->id, 'organization_id' => $org->id]);
    }

    public function test_removing_a_member_revokes_access_immediately(): void
    {
        $org = $this->org();
        $member = $this->member($org, 'analyst');
        $admin = $this->member($org, 'admin');
        $this->actingAs($member)->getJson("{$this->base($org)}/projects")->assertOk();
        $this->actingAs($admin)->deleteJson("{$this->base($org)}/members/{$member->id}")->assertNoContent();
        $this->actingAs($member)->getJson("{$this->base($org)}/projects")->assertNotFound();
    }

    public function test_full_invitation_flow(): void
    {
        Notification::fake();
        $org = $this->org();
        $admin = $this->member($org, 'admin');
        $invitee = $this->user(['email' => 'new.hire@example.com']);

        $this->actingAs($admin)->postJson("{$this->base($org)}/invitations", ['email' => 'New.Hire@Example.com', 'role' => 'analyst'])
            ->assertCreated()->assertJsonPath('data.email', 'new.hire@example.com')->assertJsonPath('data.role.key', 'analyst');

        $token = null;
        Notification::assertSentOnDemand(InvitationNotification::class, function ($n) use (&$token) {
            $token = (fn () => $this->token)->call($n);

            return true;
        });
        $this->assertNotNull($token);
        $stored = Invitation::first();
        $this->assertNotSame($token, $stored->token_hash);
        $this->assertSame(hash('sha256', $token), $stored->token_hash);
        $this->getJson("{$this->base($org)}/invitations")->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('data.0.token_hash');

        $this->actingAs($invitee)->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertOk()->assertJsonPath('data.role.key', 'analyst')->assertJsonPath('data.organization.id', $org->id);
        $this->assertDatabaseHas('organization_users', ['organization_id' => $org->id, 'user_id' => $invitee->id]);
        $this->postJson('/api/v1/invitations/accept', ['token' => $token])->assertStatus(422)->assertJsonPath('code', 'invalid_invitation');
    }

    private function invite($org, $actor, string $email = 'x@example.com', string $role = 'viewer'): string
    {
        Notification::fake();
        $this->actingAs($actor)->postJson("{$this->base($org)}/invitations", ['email' => $email, 'role' => $role])->assertCreated();
        $token = null;
        Notification::assertSentOnDemand(InvitationNotification::class, function ($n) use (&$token) {
            $token = (fn () => $this->token)->call($n);

            return true;
        });

        return $token;
    }

    public function test_invitation_only_works_for_the_invited_email(): void
    {
        $org = $this->org();
        $token = $this->invite($org, $this->member($org, 'admin'), 'right@example.com');
        $this->actingAs($this->user(['email' => 'wrong@example.com']))->postJson('/api/v1/invitations/accept', ['token' => $token])
            ->assertForbidden()->assertJsonPath('code', 'invitation_email_mismatch');
        $this->assertNull(Invitation::first()->accepted_at);
    }

    public function test_expired_revoked_and_unknown_tokens_are_rejected(): void
    {
        $org = $this->org();
        $admin = $this->member($org, 'admin');
        $user = $this->user(['email' => 'x@example.com']);

        $token = $this->invite($org, $admin);
        Invitation::first()->update(['expires_at' => now()->subMinute()]);
        $this->actingAs($user)->postJson('/api/v1/invitations/accept', ['token' => $token])->assertStatus(422);

        $token2 = $this->invite($org, $admin);
        $id = Invitation::pending()->first()->id;
        $this->actingAs($admin)->deleteJson("{$this->base($org)}/invitations/{$id}")->assertNoContent();
        $this->actingAs($user)->postJson('/api/v1/invitations/accept', ['token' => $token2])->assertStatus(422);
        $this->postJson('/api/v1/invitations/accept', ['token' => 'made-up'])->assertStatus(422);
        $this->assertDatabaseMissing('organization_users', ['user_id' => $user->id, 'organization_id' => $org->id]);
    }

    public function test_cannot_invite_above_own_role_or_existing_member_and_reinvite_replaces_old(): void
    {
        $org = $this->org();
        $this->onPlan($org, 'starter'); // member limit is covered by its own test
        $admin = $this->member($org, 'admin');
        $this->actingAs($admin)->postJson("{$this->base($org)}/invitations", ['email' => 'a@example.com', 'role' => 'owner'])
            ->assertForbidden()->assertJsonPath('code', 'role_escalation');

        $existing = $this->user(['email' => 'e@example.com']);
        $this->member($org, 'viewer', $existing);
        $this->postJson("{$this->base($org)}/invitations", ['email' => 'e@example.com', 'role' => 'viewer'])->assertStatus(422)->assertJsonPath('code', 'already_member');

        $old = $this->invite($org, $admin, 'again@example.com');
        $new = $this->invite($org, $admin, 'again@example.com');
        $this->assertSame(1, Invitation::pending()->where('email', 'again@example.com')->count());
        $this->actingAs($this->user(['email' => 'again@example.com']))->postJson('/api/v1/invitations/accept', ['token' => $old])->assertStatus(422);
        $this->postJson('/api/v1/invitations/accept', ['token' => $new])->assertOk();
    }

    public function test_member_limit_from_plan_is_enforced_including_pending_invites(): void
    {
        Notification::fake();
        $org = $this->org();            // 1 member (free plan: 3)
        $admin = $this->member($org, 'admin'); // 2
        $this->actingAs($admin)->postJson("{$this->base($org)}/invitations", ['email' => 'a@example.com', 'role' => 'viewer'])->assertCreated(); // 3 incl. pending
        $this->postJson("{$this->base($org)}/invitations", ['email' => 'b@example.com', 'role' => 'viewer'])
            ->assertForbidden()->assertJsonPath('code', 'entitlement_exceeded')->assertJsonPath('feature', 'members.max');
    }

    public function test_roles_endpoint_lists_all_six_with_permissions(): void
    {
        $this->actingAs($this->user())->getJson('/api/v1/roles')->assertOk()->assertJsonCount(6, 'data')
            ->assertJsonPath('data.0.key', 'owner')->assertJsonPath('data.5.key', 'viewer');
    }
}
