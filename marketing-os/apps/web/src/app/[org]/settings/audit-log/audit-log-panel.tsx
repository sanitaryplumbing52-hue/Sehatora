'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Select } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, Td, Th } from '@/components/ui/table';
import { api, unwrap } from '@/lib/api/client';
import { toProblem } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/format';
import { useCan, useSession } from '@/lib/permissions';

const FILTERS = [
  { value: '', label: 'All activity' },
  { value: 'org.', label: 'Organization & members' },
  { value: 'project.', label: 'Projects' },
  { value: 'website.', label: 'Websites' },
];

export function AuditLogPanel() {
  const orgId = useSession().membership.organization.id;
  const allowed = useCan()('audit.view');
  const [action, setAction] = useState('');
  const q = useInfiniteQuery({
    queryKey: ['audit', orgId, action],
    enabled: allowed,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      unwrap(api.GET('/orgs/{org}/audit-logs', { params: { path: { org: orgId }, query: { per_page: 25, ...(action ? { action } : {}), ...(pageParam ? { cursor: pageParam } : {}) } } })),
    getNextPageParam: (last) => last.meta.next_cursor ?? undefined,
  });

  if (!allowed) return <EmptyState title="You don't have access to the audit log" description="Ask an Owner or Admin." />;
  const rows = q.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select aria-label="Filter" value={action} onChange={(e) => setAction(e.target.value)} className="w-56">
          {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Select>
        <p className="text-xs text-ink-3">Append-only. IP addresses are stored per the organization&apos;s privacy policy (truncated by default).</p>
      </div>
      {q.error && <ProblemAlert problem={toProblem(q.error)} />}
      {q.isPending ? <Skeleton className="h-40" /> : rows.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>When</Th><Th>Who</Th><Th>Action</Th><Th>Details</Th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap text-ink-2">{formatDateTime(r.created_at)}</Td>
                  <Td>{r.actor_email ?? 'System'}</Td>
                  <Td className="font-mono text-xs">{r.action}</Td>
                  <Td className="max-w-xs truncate text-xs text-ink-3" title={r.metadata ? JSON.stringify(r.metadata) : undefined}>
                    {r.subject_type ?? ''}{r.metadata ? ` · ${Object.entries(r.metadata).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(', ')}` : ''}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {q.hasNextPage && <CardBody><Button variant="secondary" onClick={() => void q.fetchNextPage()} loading={q.isFetchingNextPage}>Load more</Button></CardBody>}
        </Card>
      )}
    </div>
  );
}
