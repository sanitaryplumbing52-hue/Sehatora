'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { passwordSchema } from '@/lib/validation';

const schema = z
  .object({ password: passwordSchema, password_confirmation: z.string() })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'Passwords do not match.' });
type Values = z.infer<typeof schema>;

export function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';
  const [done, setDone] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: '', password_confirmation: '' } });
  const { run, pending, problem } = useAction<Values>(form.setError);

  if (!token || !email) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">This reset link is incomplete</h1>
        <p className="text-sm text-ink-2">Request a new link and use the one from the newest email.</p>
        <Link href="/forgot-password" className="text-sm text-accent underline underline-offset-2">Request a new link</Link>
      </div>
    );
  }
  if (done) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">Password updated</h1>
        <p className="text-sm text-ink-2">You were signed out everywhere. Sign in with your new password.</p>
        <Button asChild className="w-full"><Link href="/login">Sign in</Link></Button>
      </div>
    );
  }

  async function onSubmit(values: Values) {
    const res = await run(async () => unwrap(api.POST('/auth/reset-password', { body: { ...values, token, email } })));
    if (res.ok) setDone(true);
  }
  const e = form.formState.errors;
  return (
    <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-lg font-semibold">Choose a new password</h1>
      {problem && <ProblemAlert problem={problem} />}
      <Field label="New password" hint="At least 12 characters, with a letter and a number." error={e.password?.message}>
        {(a) => <Input {...a} type="password" autoComplete="new-password" {...form.register('password')} />}
      </Field>
      <Field label="Confirm new password" error={e.password_confirmation?.message}>
        {(a) => <Input {...a} type="password" autoComplete="new-password" {...form.register('password_confirmation')} />}
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Update password</Button>
    </form>
  );
}
