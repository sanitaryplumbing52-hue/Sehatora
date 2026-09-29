'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';
import { websiteUrlSchema } from '@/lib/validation';

const base = z.object({ name: z.string().trim().min(2, 'Use at least 2 characters.').max(120), url: z.string() });
type Values = z.infer<typeof base>;

export function CreateProjectForm({ orgSlug, withWebsite = false, onDone }: { orgSlug: string; withWebsite?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const { membership } = useSession();
  const orgId = membership.organization.id;
  const [createdId, setCreatedId] = useState<string | null>(null);

  const schema = withWebsite
    ? base.extend({ url: websiteUrlSchema })
    : base.extend({ url: z.string().trim().refine((v) => v === '' || websiteUrlSchema.safeParse(v).success, 'Enter a valid website address, e.g. example.com.') });
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', url: '' } });
  const { run, pending, problem } = useAction<Values>(form.setError);
  const e = form.formState.errors;

  async function onSubmit(values: Values) {
    let projectId = createdId;
    if (!projectId) {
      const res = await run(async () => unwrap(api.POST('/orgs/{org}/projects', { params: { path: { org: orgId } }, body: { name: values.name } })));
      if (!res.ok) return;
      projectId = res.value.data.id;
      setCreatedId(projectId);
    }
    if (values.url.trim() !== '') {
      const site = await run(async () =>
        unwrap(api.POST('/orgs/{org}/projects/{project}/websites', { params: { path: { org: orgId, project: projectId! } }, body: { url: values.url } })),
      );
      if (!site.ok) return; // project exists; the form stays open so the URL can be corrected
    }
    onDone?.();
    router.push(`/${orgSlug}/projects/${projectId}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {problem && <ProblemAlert problem={problem} />}
      {createdId && problem && (
        <p className="text-sm text-ink-2">
          The project was created, but the website was not added. Fix the address and try again, or{' '}
          <Link className="text-accent underline underline-offset-2" href={`/${orgSlug}/projects/${createdId}`}>continue without it</Link>.
        </p>
      )}
      <Field label="Project name" error={e.name?.message}>
        {(a) => <Input {...a} placeholder="e.g. Ariston UAE" disabled={!!createdId} {...form.register('name')} />}
      </Field>
      <Field label={withWebsite ? 'Website' : 'Website (optional)'} hint="The site you want to audit and track. You can add more later." error={e.url?.message}>
        {(a) => <Input {...a} placeholder="example.com" inputMode="url" autoComplete="url" {...form.register('url')} />}
      </Field>
      <Button type="submit" loading={pending}>{withWebsite ? 'Add website & create project' : 'Create project'}</Button>
    </form>
  );
}
