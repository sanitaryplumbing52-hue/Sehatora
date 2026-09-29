'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, Td, Th } from '@/components/ui/table';
import { api, unwrap } from '@/lib/api/client';
import { toProblem } from '@/lib/api/errors';
import { formatDate } from '@/lib/format';
import { useCan, useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';
import { emailSchema } from '@/lib/validation';

const ROLES = ['owner', 'admin', 'manager', 'analyst', 'editor', 'viewer'] as const;
const RANK: Record<string, number> = { owner: 1, admin: 2, manager: 3, analyst: 4, editor: 5, viewer: 6 };
const inviteSchema = z.object({ email: emailSchema, role: z.enum(ROLES) });
type Invite = z.infer<typeof inviteSchema>;

export function MembersPanel() {
  const { membership, user } = useSession();
  const orgId = membership.organization.id;
  const can = useCan();
  const manage = can('members.manage');
  const myRank = RANK[membership.role.key] ?? 99;
  const qc = useQueryClient();
  const path = { org: orgId };

  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => unwrap(api.GET('/orgs/{org}/members', { params: { path } })) });
  const invites = useQuery({ queryKey: ['invitations', orgId], queryFn: () => unwrap(api.GET('/orgs/{org}/invitations', { params: { path } })), enabled: can('members.view') });

  const changeRole = useMutation({
    mutationFn: (v: { userId: string; role: (typeof ROLES)[number] }) => unwrap(api.PATCH('/orgs/{org}/members/{user}', { params: { path: { ...path, user: v.userId } }, body: { role: v.role } })),
    onSettled: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
  const remove = useMutation({
    mutationFn: (userId: string) => unwrap(api.DELETE('/orgs/{org}/members/{user}', { params: { path: { ...path, user: userId } } })),
    onSettled: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  });
  const revoke = useMutation({
    mutationFn: (id: string) => unwrap(api.DELETE('/orgs/{org}/invitations/{invitation}', { params: { path: { ...path, invitation: id } } })),
    onSettled: () => qc.invalidateQueries({ queryKey: ['invitations', orgId] }),
  });

  const form = useForm<Invite>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '', role: 'viewer' } });
  const invite = useAction<Invite>(form.setError);
  async function onInvite(v: Invite) {
    const res = await invite.run(async () => unwrap(api.POST('/orgs/{org}/invitations', { params: { path }, body: v })));
    if (res.ok) {
      form.reset();
      await qc.invalidateQueries({ queryKey: ['invitations', orgId] });
    }
  }

  const mutationProblem = [changeRole, remove, revoke].map((m) => (m.error ? toProblem(m.error) : null)).find(Boolean);

  return (
    <div className="space-y-6">
      {mutationProblem && <ProblemAlert problem={mutationProblem} />}
      <Card>
        <CardHeader title="Members" description="Roles control what each person can see and change." />
        {members.isPending ? (
          <CardBody><Skeleton className="h-24" /></CardBody>
        ) : members.error ? (
          <CardBody><ProblemAlert problem={toProblem(members.error)} /></CardBody>
        ) : (
          <Table>
            <thead><tr><Th>Member</Th><Th>Role</Th><Th>2FA</Th><Th>Joined</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
            <tbody>
              {members.data.data.map((m) => {
                const editable = manage && myRank <= (RANK[m.role.key] ?? 99);
                return (
                  <tr key={m.user_id}>
                    <Td><div className="font-medium">{m.name}{m.user_id === user.id && <span className="ml-1 text-ink-3">(you)</span>}</div><div className="text-xs text-ink-3">{m.email}</div></Td>
                    <Td>
                      {editable ? (
                        <Select aria-label={`Role for ${m.name}`} value={m.role.key} className="w-32" onChange={(e) => changeRole.mutate({ userId: m.user_id, role: e.target.value as (typeof ROLES)[number] })}>
                          {ROLES.filter((r) => (RANK[r] ?? 0) >= myRank).map((r) => <option key={r} value={r}>{r[0]!.toUpperCase() + r.slice(1)}</option>)}
                        </Select>
                      ) : <Badge tone={m.role.key === 'owner' ? 'accent' : 'neutral'}>{m.role.name}</Badge>}
                    </Td>
                    <Td>{m.two_factor_enabled ? <Badge tone="ok">On</Badge> : <span className="text-ink-3">Off</span>}</Td>
                    <Td className="text-ink-2">{formatDate(m.joined_at)}</Td>
                    <Td className="text-right">
                      {editable && m.user_id !== user.id && (
                        <Button variant="ghost" size="sm" onClick={() => { if (window.confirm(`Remove ${m.name}?`)) remove.mutate(m.user_id); }}>Remove</Button>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {manage && (
        <Card>
          <CardHeader title="Invite someone" description="They receive an email link valid for 7 days and must sign in with that address." />
          <CardBody>
            <form method="post" onSubmit={form.handleSubmit(onInvite)} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
              <Field label="Email" error={form.formState.errors.email?.message} className="flex-1">{(a) => <Input {...a} type="email" {...form.register('email')} />}</Field>
              <Field label="Role" className="sm:w-40">
                {(a) => (
                  <Select {...a} {...form.register('role')}>
                    {ROLES.filter((r) => (RANK[r] ?? 0) >= myRank).map((r) => <option key={r} value={r}>{r[0]!.toUpperCase() + r.slice(1)}</option>)}
                  </Select>
                )}
              </Field>
              <Button type="submit" loading={invite.pending} className="sm:mt-6">Send invite</Button>
            </form>
            {invite.problem && <div className="mt-3"><ProblemAlert problem={invite.problem} /></div>}
          </CardBody>
        </Card>
      )}

      {invites.data && invites.data.data.length > 0 && (
        <Card>
          <CardHeader title="Pending invitations" />
          <Table>
            <thead><tr><Th>Email</Th><Th>Role</Th><Th>Expires</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
            <tbody>
              {invites.data.data.map((i) => (
                <tr key={i.id}>
                  <Td>{i.email}</Td><Td>{i.role.name}</Td><Td className="text-ink-2">{formatDate(i.expires_at)}</Td>
                  <Td className="text-right">{manage && <Button variant="ghost" size="sm" onClick={() => revoke.mutate(i.id)}>Revoke</Button>}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
