'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useAction } from '@/lib/use-action';
import { hardNavigate } from '@/lib/navigate';

export function AcceptInvitation() {
  const token = useSearchParams().get('token') ?? '';
  const { run, pending, problem } = useAction();
  const next = `/invitations/accept?token=${encodeURIComponent(token)}`;

  async function accept() {
    const res = await run(async () => unwrap(api.POST('/invitations/accept', { body: { token } })));
    if (res.ok) hardNavigate(`/${res.value.data.organization.slug}/dashboard`);
  }

  if (!token) return <p className="text-sm text-ink-2">This invitation link is incomplete. Ask your admin to send it again.</p>;
  const unauth = problem?.code === 'unauthenticated';
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">You&apos;ve been invited</h1>
      <p className="text-sm text-ink-2">Accept to join the organization. You must be signed in with the email address the invitation was sent to.</p>
      {problem && !unauth && <ProblemAlert problem={problem} />}
      {unauth ? (
        <div className="space-y-2">
          <Button asChild className="w-full"><Link href={`/login?next=${encodeURIComponent(next)}`}>Sign in to accept</Link></Button>
          <Button asChild variant="secondary" className="w-full"><Link href="/register">Create an account</Link></Button>
        </div>
      ) : (
        <Button className="w-full" onClick={() => void accept()} loading={pending}>Accept invitation</Button>
      )}
    </div>
  );
}

