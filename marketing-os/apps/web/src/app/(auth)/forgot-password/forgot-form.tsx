'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { emailSchema } from '@/lib/validation';

const schema = z.object({ email: emailSchema });
type Values = z.infer<typeof schema>;

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });
  const { run, pending, problem } = useAction<Values>(form.setError);

  async function onSubmit(values: Values) {
    const res = await run(async () => unwrap(api.POST('/auth/forgot-password', { body: values })));
    if (res.ok) setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <h1 className="text-lg font-semibold">Check your email</h1>
        <p className="text-sm text-ink-2">If that address is registered, we sent a link to reset your password. The link expires in 60 minutes.</p>
        <Link href="/login" className="text-sm text-accent underline underline-offset-2">Back to sign in</Link>
      </div>
    );
  }
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-lg font-semibold">Reset your password</h1>
      {problem && <ProblemAlert problem={problem} />}
      <Field label="Email" error={form.formState.errors.email?.message}>{(a) => <Input {...a} type="email" autoComplete="email" {...form.register('email')} />}</Field>
      <Button type="submit" className="w-full" loading={pending}>Send reset link</Button>
      <Link href="/login" className="block text-center text-sm text-accent underline underline-offset-2">Back to sign in</Link>
    </form>
  );
}
