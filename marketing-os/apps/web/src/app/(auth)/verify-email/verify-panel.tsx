'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { hardNavigate } from '@/lib/navigate';

export function VerifyPanel({ email, invalidLink }: { email: string; invalidLink: boolean }) {
  const [sent, setSent] = useState(false);
  const { run, pending, problem } = useAction();

  async function resend() {
    const res = await run(async () => unwrap(api.POST('/auth/email/resend')));
    if (res.ok) setSent(true);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Verify your email</h1>
      {invalidLink && <p role="alert" className="rounded bg-danger-soft px-3 py-2 text-sm text-danger">That verification link is invalid or expired. Request a new one below.</p>}
      <p className="text-sm text-ink-2">
        We sent a verification link to <strong className="text-ink">{email}</strong>. Open it to activate your account, then continue.
      </p>
      {problem && <ProblemAlert problem={problem} />}
      {sent && <p role="status" className="rounded bg-ok-soft px-3 py-2 text-sm text-ok">A new verification email is on its way.</p>}
      <div className="flex flex-col gap-2">
        <Button onClick={() => hardNavigate('/')}>I&apos;ve verified — continue</Button>
        <Button variant="secondary" onClick={() => void resend()} loading={pending}>Resend email</Button>
      </div>
    </div>
  );
}
