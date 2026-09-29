'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { emailSchema, passwordSchema } from '@/lib/validation';
import { hardNavigate } from '@/lib/navigate';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name.').max(120),
    email: emailSchema,
    password: passwordSchema,
    password_confirmation: z.string(),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ['password_confirmation'], message: 'Passwords do not match.' });
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: '', email: '', password: '', password_confirmation: '' } });
  const { run, pending, problem } = useAction<Values>(form.setError);
  const e = form.formState.errors;

  async function onSubmit(values: Values) {
    const res = await run(async () => unwrap(api.POST('/auth/register', { body: values })));
    if (res.ok) hardNavigate('/verify-email');
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h1 className="text-lg font-semibold">Create your account</h1>
      {problem && <ProblemAlert problem={problem} />}
      <Field label="Name" error={e.name?.message}>{(a) => <Input {...a} autoComplete="name" {...form.register('name')} />}</Field>
      <Field label="Work email" error={e.email?.message}>{(a) => <Input {...a} type="email" autoComplete="email" {...form.register('email')} />}</Field>
      <Field label="Password" hint="At least 12 characters, with a letter and a number." error={e.password?.message}>
        {(a) => <Input {...a} type="password" autoComplete="new-password" {...form.register('password')} />}
      </Field>
      <Field label="Confirm password" error={e.password_confirmation?.message}>
        {(a) => <Input {...a} type="password" autoComplete="new-password" {...form.register('password_confirmation')} />}
      </Field>
      <Button type="submit" className="w-full" loading={pending}>Create account</Button>
      <p className="text-center text-sm text-ink-2">
        Already registered? <Link href="/login" className="text-accent underline underline-offset-2">Sign in</Link>
      </p>
    </form>
  );
}
