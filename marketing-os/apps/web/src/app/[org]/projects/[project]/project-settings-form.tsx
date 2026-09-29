'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input, Textarea } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';

const schema = z.object({ name: z.string().trim().min(2).max(120), industry: z.string().max(120), market: z.string().max(120), goals: z.string().max(4000) });
type Values = z.infer<typeof schema>;

export function ProjectSettingsForm({ project }: { project: { id: string; name: string; industry: string; market: string; goals: string[] } }) {
  const router = useRouter();
  const orgId = useSession().membership.organization.id;
  const [saved, setSaved] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: project.name, industry: project.industry, market: project.market, goals: project.goals.join('\n') } });
  const { run, pending, problem } = useAction<Values>(form.setError);

  async function onSubmit(v: Values) {
    setSaved(false);
    const goals = v.goals.split('\n').map((g) => g.trim()).filter(Boolean);
    const res = await run(async () =>
      unwrap(api.PATCH('/orgs/{org}/projects/{project}', { params: { path: { org: orgId, project: project.id } }, body: { name: v.name, industry: v.industry || null, market: v.market || null, goals } })),
    );
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
      {problem && <div className="sm:col-span-2"><ProblemAlert problem={problem} /></div>}
      <Field label="Name" error={form.formState.errors.name?.message}>{(a) => <Input {...a} {...form.register('name')} />}</Field>
      <Field label="Industry">{(a) => <Input {...a} {...form.register('industry')} />}</Field>
      <Field label="Market" hint="Country or region you sell in.">{(a) => <Input {...a} {...form.register('market')} />}</Field>
      <Field label="Business goals" hint="One per line.">{(a) => <Textarea {...a} {...form.register('goals')} />}</Field>
      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" loading={pending}>Save changes</Button>
        {saved && <span role="status" className="text-sm text-ok">Saved.</span>}
      </div>
    </form>
  );
}
