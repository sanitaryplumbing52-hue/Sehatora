'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';

type Enrolment = components['schemas']['TwoFactorEnrolment'];

export function TwoFactorCard() {
  const { user } = useSession();
  const router = useRouter();
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  const pw = useForm<{ password: string }>({ defaultValues: { password: '' } });
  const start = useAction<{ password: string }>(pw.setError);
  const code = useForm<{ code: string }>({ defaultValues: { code: '' } });
  const confirm = useAction<{ code: string }>(code.setError);
  const off = useForm<{ password: string }>({ defaultValues: { password: '' } });
  const disable = useAction<{ password: string }>(off.setError);

  async function onStart({ password }: { password: string }) {
    const res = await start.run(async () => (await unwrap(api.POST('/me/2fa/enable', { body: { password } }))).data);
    if (res.ok) { setEnrolment(res.value); pw.reset(); }
  }
  async function onConfirm(v: { code: string }) {
    const res = await confirm.run(async () => (await unwrap(api.POST('/me/2fa/confirm', { body: v }))).data);
    if (res.ok) { setCodes(res.value.recovery_codes); setEnrolment(null); code.reset(); router.refresh(); }
  }
  async function onDisable({ password }: { password: string }) {
    const res = await disable.run(async () => unwrap(api.DELETE('/me/2fa', { body: { password } })));
    if (res.ok) { off.reset(); setCodes(null); router.refresh(); }
  }

  return (
    <Card>
      <CardHeader title="Two-factor authentication" description="Adds a 6-digit code from an authenticator app to sign-in." actions={<Badge tone={user.two_factor_enabled ? 'ok' : 'neutral'}>{user.two_factor_enabled ? 'On' : 'Off'}</Badge>} />
      <CardBody className="space-y-4">
        {codes && (
          <div role="status" className="rounded-md border border-warn/40 bg-warn-soft p-3 text-sm">
            <p className="font-medium text-warn">Save your recovery codes now — they are shown only once.</p>
            <ul className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-ink">{codes.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        )}
        {user.two_factor_enabled ? (
          <form onSubmit={off.handleSubmit(onDisable)} className="max-w-sm space-y-3" noValidate>
            {disable.problem && <ProblemAlert problem={disable.problem} />}
            <Field label="Confirm password to turn off" error={off.formState.errors.password?.message}>
              {(a) => <Input {...a} type="password" autoComplete="current-password" {...off.register('password', { required: 'Enter your password.' })} />}
            </Field>
            <Button type="submit" variant="secondary" loading={disable.pending}>Turn off two-factor</Button>
          </form>
        ) : enrolment ? (
          <form onSubmit={code.handleSubmit(onConfirm)} className="max-w-sm space-y-3" noValidate>
            <p className="text-sm text-ink-2">Scan this QR code with your authenticator app, then enter the 6-digit code it shows.</p>
            {/* eslint-disable-next-line @next/next/no-img-element -- server-generated SVG data URL; rendering via <img> keeps it script-inert */}
            <img alt="Two-factor QR code" width={192} height={192} className="rounded border border-line bg-white p-1" src={`data:image/svg+xml;utf8,${encodeURIComponent(enrolment.qr_svg)}`} />
            <p className="text-xs text-ink-3">Can&apos;t scan? Enter this key manually: <span className="break-all font-mono text-ink">{enrolment.secret}</span></p>
            {confirm.problem && <ProblemAlert problem={confirm.problem} />}
            <Field label="6-digit code" error={code.formState.errors.code?.message}>
              {(a) => <Input {...a} inputMode="numeric" autoComplete="one-time-code" {...code.register('code', { required: 'Enter the code.' })} />}
            </Field>
            <Button type="submit" loading={confirm.pending}>Confirm and turn on</Button>
          </form>
        ) : (
          <form onSubmit={pw.handleSubmit(onStart)} className="max-w-sm space-y-3" noValidate>
            {start.problem && <ProblemAlert problem={start.problem} />}
            <Field label="Confirm password to begin" error={pw.formState.errors.password?.message}>
              {(a) => <Input {...a} type="password" autoComplete="current-password" {...pw.register('password', { required: 'Enter your password.' })} />}
            </Field>
            <Button type="submit" loading={start.pending}>Set up two-factor</Button>
          </form>
        )}
      </CardBody>
    </Card>
  );
}
