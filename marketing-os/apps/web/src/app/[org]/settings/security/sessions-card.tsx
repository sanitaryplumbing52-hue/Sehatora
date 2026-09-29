'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, Td, Th } from '@/components/ui/table';
import { api, unwrap } from '@/lib/api/client';
import { toProblem } from '@/lib/api/errors';
import { formatRelativeTime } from '@/lib/format';

export function SessionsCard() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['sessions'], queryFn: () => unwrap(api.GET('/me/sessions')) });
  const revoke = useMutation({
    mutationFn: (id: string) => unwrap(api.DELETE('/me/sessions/{id}', { params: { path: { id } } })),
    onSettled: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
  return (
    <Card>
      <CardHeader title="Signed-in devices" description="Sign out any device you don't recognise." />
      {q.isPending ? <div className="p-5"><Skeleton className="h-16" /></div> : q.error ? <div className="p-5"><ProblemAlert problem={toProblem(q.error)} /></div> : (
        <Table>
          <thead><tr><Th>Device</Th><Th>IP</Th><Th>Last active</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
          <tbody>
            {q.data.data.map((s) => (
              <tr key={s.id}>
                <Td className="max-w-xs truncate" title={s.user_agent ?? undefined}>{s.user_agent ?? 'Unknown device'} {s.is_current && <Badge tone="accent" className="ml-1">This device</Badge>}</Td>
                <Td className="font-mono text-xs text-ink-2">{s.ip_address ?? '—'}</Td>
                <Td className="text-ink-2">{formatRelativeTime(s.last_active_at) ?? '—'}</Td>
                <Td className="text-right">{!s.is_current && <Button variant="ghost" size="sm" onClick={() => revoke.mutate(s.id)}>Sign out</Button>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {revoke.error && <div className="p-5"><ProblemAlert problem={toProblem(revoke.error)} /></div>}
    </Card>
  );
}
