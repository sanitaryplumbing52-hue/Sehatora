'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, Td, Th } from '@/components/ui/table';
import { api, unwrap } from '@/lib/api/client';
import { toProblem } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';

const TONE = { success: 'ok', failed: 'danger', two_factor_failed: 'danger', locked: 'warn' } as const;
const LABEL = { success: 'Signed in', failed: 'Failed attempt', two_factor_failed: 'Failed 2FA code', locked: 'Locked out' } as const;

export function ActivityCard() {
  const q = useQuery({ queryKey: ['login-activity'], queryFn: () => unwrap(api.GET('/me/login-activity')) });
  return (
    <Card>
      <CardHeader title="Recent sign-in activity" description="The last 50 attempts on your account." />
      {q.isPending ? <div className="p-5"><Skeleton className="h-16" /></div> : q.error ? <div className="p-5"><ProblemAlert problem={toProblem(q.error)} /></div> : (
        <Table>
          <thead><tr><Th>When</Th><Th>Result</Th><Th>IP</Th></tr></thead>
          <tbody>
            {q.data.data.map((a) => (
              <tr key={a.id}>
                <Td className="whitespace-nowrap text-ink-2">{formatDateTime(a.created_at)}</Td>
                <Td><Badge tone={TONE[a.outcome]}>{LABEL[a.outcome]}</Badge></Td>
                <Td className="font-mono text-xs text-ink-2">{a.ip_address ?? '—'}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}
