'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { hardNavigate } from '@/lib/navigate';

const schema = z.object({ name: z.string().trim().min(2, 'Use at least 2 characters.').max(120) });
type Values = z.infer<typeof schema>;

export function CreateOrgForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '' } });
  const { run, pending, problem } = useAction<Values>(form.setError);

  async function onSubmit(values: Values) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await run(async () => unwrap(api.POST('/orgs', { body: { ...values, timezone } })));
    if (res.ok) hardNavigate(`/${res.value.data.organization.slug}/dashboard`);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-lg font-semibold">Welcome to Marketing Intelligence OS</h1>
        <p className="mt-1 text-sm text-ink-2">Start by naming your organization — usually your company or agency. You can invite teammates next.</p>
      </div>
      {problem && <ProblemAlert problem={problem} />}
      <Field label="Organization name" error={form.formState.errors.name?.message}>
        {(a) => <Input {...a} autoFocus autoComplete="organization" {...form.register('name')} />}
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Create organization</Button>
    </form>
  );
}
