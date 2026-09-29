'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';

const schema = z.object({ name: z.string().trim().min(1, 'Enter your name.').max(120), timezone: z.string().min(1), locale: z.enum(['en', 'ar']) });
type Values = z.infer<typeof schema>;

export function ProfileForm() {
  const { user } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: user.name, timezone: user.timezone ?? 'UTC', locale: (user.locale as 'en' | 'ar') ?? 'en' } });
  const { run, pending, problem } = useAction<Values>(form.setError);

  async function onSubmit(v: Values) {
    setSaved(false);
    const res = await run(async () => unwrap(api.PATCH('/me', { body: v })));
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }
  return (
    <Card className="max-w-2xl">
      <CardHeader title="Profile" description={user.email} />
      <CardBody>
        <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {problem && <ProblemAlert problem={problem} />}
          <Field label="Name" error={form.formState.errors.name?.message}>{(a) => <Input {...a} {...form.register('name')} />}</Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Time zone" error={form.formState.errors.timezone?.message}>{(a) => <Input {...a} {...form.register('timezone')} />}</Field>
            <Field label="Language">{(a) => <Select {...a} {...form.register('locale')}><option value="en">English</option><option value="ar">العربية</option></Select>}</Field>
          </div>
          <div className="flex items-center gap-3"><Button type="submit" loading={pending}>Save changes</Button>{saved && <span role="status" className="text-sm text-ok">Saved.</span>}</div>
        </form>
      </CardBody>
    </Card>
  );
}
