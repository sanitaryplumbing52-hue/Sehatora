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
import { safeNextPath } from '@/lib/safe-redirect';
import { useAction } from '@/lib/use-action';
import { emailSchema } from '@/lib/validation';
import { hardNavigate } from '@/lib/navigate';

const schema = z.object({ email: emailSchema, password: z.string().min(1, 'Enter your password.'), remember: z.boolean() });
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'), '/');
  const [needsCode, setNeedsCode] = useState(false);
  const [useRecovery, setUseRecovery] = useState(false);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '', remember: false } });
  const { run, pending, problem } = useAction<Values>(form.setError);
  const codeForm = useForm<{ code: string }>({ defaultValues: { code: '' } });
  const challenge = useAction<{ code: string }>(codeForm.setError);

  const done = () => hardNavigate(next);

  async function onSubmit(values: Values) {
    const res = await run(async () => unwrap(api.POST('/auth/login', { body: values })));
    if (!res.ok) return;
    if ('two_factor_required' in res.value) setNeedsCode(true);
    else done();
  }

  async function onCode({ code }: { code: string }) {
    const body = useRecovery ? { recovery_code: code } : { code };
    const res = await challenge.run(async () => unwrap(api.POST('/auth/2fa/challenge', { body })));
    if (res.ok) done();
  }

  if (needsCode) {
    return (
      <form method="post" onSubmit={codeForm.handleSubmit(onCode)} className="space-y-4" noValidate>
        <div>
          <h1 className="text-lg font-semibold">Two-factor authentication</h1>
          <p className="mt-1 text-sm text-ink-2">
            {useRecovery ? 'Enter one of your recovery codes.' : 'Enter the 6-digit code from your authenticator app.'}
          </p>
        </div>
        {challenge.problem && <ProblemAlert problem={challenge.problem} />}
        <Field label={useRecovery ? 'Recovery code' : 'Authentication code'} error={codeForm.formState.errors.code?.message}>
          {(a) => <Input {...a} autoComplete="one-time-code" inputMode={useRecovery ? 'text' : 'numeric'} autoFocus {...codeForm.register('code', { required: 'Enter the code.' })} />}
        </Field>
        <Button type="submit" className="w-full" loading={challenge.pending}>Verify</Button>
        <button type="button" className="text-sm text-accent underline underline-offset-2" onClick={() => setUseRecovery((v) => !v)}>
          {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code'}
        </button>
      </form>
    );
  }

  return (
    <form method="post" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        {params.get('verified') && <p role="status" className="mt-2 rounded bg-ok-soft px-3 py-2 text-sm text-ok">Email verified. Sign in to continue.</p>}
      </div>
      {problem && <ProblemAlert problem={problem} />}
      <Field label="Email" error={form.formState.errors.email?.message}>
        {(a) => <Input {...a} type="email" autoComplete="email" {...form.register('email')} />}
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        {(a) => <Input {...a} type="password" autoComplete="current-password" {...form.register('password')} />}
      </Field>
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-ink-2"><input type="checkbox" {...form.register('remember')} /> Remember me</label>
        <Link href="/forgot-password" className="text-accent underline underline-offset-2">Forgot password?</Link>
      </div>
      <Button type="submit" className="w-full" loading={pending}>Sign in</Button>
      <p className="text-center text-sm text-ink-2">
        New here? <Link href="/register" className="text-accent underline underline-offset-2">Create an account</Link>
      </p>
    </form>
  );
}
