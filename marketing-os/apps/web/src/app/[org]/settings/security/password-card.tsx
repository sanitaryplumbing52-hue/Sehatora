'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { passwordSchema } from '@/lib/validation';

const schema = z
  .object({ current_password: z.string().min(1, 'Enter your current password.'), password: passwordSchema, password_confirmation: z.string() })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'Passwords do not match.' });
type Values = z.infer<typeof schema>;

export function PasswordCard() {
  const [done, setDone] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { current_password: '', password: '', password_confirmation: '' } });
  const { run, pending, problem } = useAction<Values>(form.setError);
  const e = form.formState.errors;

  async function onSubmit(v: Values) {
    setDone(false);
    const res = await run(async () => unwrap(api.PUT('/me/password', { body: v })));
    if (res.ok) { setDone(true); form.reset(); }
  }
  return (
    <Card>
      <CardHeader title="Password" description="Changing your password signs out all other devices." />
      <CardBody>
        <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-sm space-y-3" noValidate>
          {problem && <ProblemAlert problem={problem} />}
          <Field label="Current password" error={e.current_password?.message}>{(a) => <Input {...a} type="password" autoComplete="current-password" {...form.register('current_password')} />}</Field>
          <Field label="New password" error={e.password?.message}>{(a) => <Input {...a} type="password" autoComplete="new-password" {...form.register('password')} />}</Field>
          <Field label="Confirm new password" error={e.password_confirmation?.message}>{(a) => <Input {...a} type="password" autoComplete="new-password" {...form.register('password_confirmation')} />}</Field>
          <div className="flex items-center gap-3"><Button type="submit" loading={pending}>Update password</Button>{done && <span role="status" className="text-sm text-ok">Password updated.</span>}</div>
        </form>
      </CardBody>
    </Card>
  );
}
