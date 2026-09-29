'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useCan, useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';
import { hardNavigate } from '@/lib/navigate';

const schema = z.object({ name: z.string().trim().min(2).max(120), timezone: z.string().min(1), default_currency: z.string().length(3, 'Use a 3-letter currency code, e.g. USD.') });
type Values = z.infer<typeof schema>;

export function OrgSettings() {
  const { membership } = useSession();
  const org = membership.organization;
  const can = useCan();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const canEdit = can('org.update');

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: org.name, timezone: org.timezone ?? 'UTC', default_currency: org.default_currency ?? 'USD' } });
  const { run, pending, problem } = useAction<Values>(form.setError);
  const del = useForm<{ password: string }>({ defaultValues: { password: '' } });
  const delAction = useAction<{ password: string }>(del.setError);
  const e = form.formState.errors;

  async function onSubmit(v: Values) {
    setSaved(false);
    const res = await run(async () => unwrap(api.PATCH('/orgs/{org}', { params: { path: { org: org.id } }, body: v })));
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }
  async function onDelete({ password }: { password: string }) {
    if (!window.confirm(`Delete ${org.name}? Members lose access immediately.`)) return;
    const res = await delAction.run(async () => unwrap(api.DELETE('/orgs/{org}', { params: { path: { org: org.id } }, body: { password } })));
    if (res.ok) hardNavigate('/');
  }
  async function leave() {
    if (!window.confirm(`Leave ${org.name}?`)) return;
    const res = await delAction.run(async () => unwrap(api.POST('/orgs/{org}/leave', { params: { path: { org: org.id } } })));
    if (res.ok) hardNavigate('/');
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader title="Organization" description={`Your role: ${membership.role.name}`} />
        <CardBody>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {problem && <ProblemAlert problem={problem} />}
            <Field label="Name" error={e.name?.message}>{(a) => <Input {...a} disabled={!canEdit} {...form.register('name')} />}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Time zone" error={e.timezone?.message}>{(a) => <Input {...a} disabled={!canEdit} {...form.register('timezone')} />}</Field>
              <Field label="Default currency" error={e.default_currency?.message}>{(a) => <Input {...a} disabled={!canEdit} maxLength={3} {...form.register('default_currency')} />}</Field>
            </div>
            {canEdit ? (
              <div className="flex items-center gap-3"><Button type="submit" loading={pending}>Save changes</Button>{saved && <span role="status" className="text-sm text-ok">Saved.</span>}</div>
            ) : (
              <p className="text-sm text-ink-3">You need the Admin or Owner role to change these settings.</p>
            )}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Leave or delete" />
        <CardBody className="space-y-4">
          {delAction.problem && <ProblemAlert problem={delAction.problem} />}
          <div>
            <Button variant="secondary" onClick={() => void leave()}>Leave organization</Button>
            <p className="mt-1 text-xs text-ink-3">An organization must keep at least one Owner.</p>
          </div>
          {can('org.delete') && (
            <form onSubmit={del.handleSubmit(onDelete)} className="space-y-3 border-t border-line pt-4">
              <Field label="Confirm your password to delete this organization" error={del.formState.errors.password?.message}>
                {(a) => <Input {...a} type="password" autoComplete="current-password" {...del.register('password', { required: 'Enter your password.' })} />}
              </Field>
              <Button type="submit" variant="danger" loading={delAction.pending}>Delete organization</Button>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
