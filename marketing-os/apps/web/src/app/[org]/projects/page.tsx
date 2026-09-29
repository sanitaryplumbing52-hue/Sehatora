import type { Metadata } from 'next';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td, Th } from '@/components/ui/table';
import { serverApi, unwrapServer } from '@/lib/api/server';
import { formatDate } from '@/lib/format';
import { NewProjectDialog } from './new-project-dialog';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ archived?: string }> }) {
  const { org } = await params;
  const { archived } = await searchParams;
  const showArchived = archived === '1';
  const api = await serverApi();
  const orgs = await unwrapServer(api.GET('/me/organizations'));
  const m = orgs.data.find((x) => x.organization.slug === org || x.organization.id === org);
  if (!m) return null;
  const projects = await unwrapServer(api.GET('/orgs/{org}/projects', { params: { path: { org: m.organization.id }, query: { per_page: 100, archived: showArchived } } }));
  const canManage = m.permissions.includes('projects.manage');

  return (
    <>
      <PageHeader
        title="Projects"
        description="A project groups the websites, data sources, reports and work for one client or brand."
        actions={canManage ? <NewProjectDialog orgSlug={m.organization.slug} /> : undefined}
      />
      <div className="mb-3 flex gap-3 text-sm">
        <Link href={`/${org}/projects`} className={showArchived ? 'text-ink-2 hover:text-ink' : 'font-medium text-accent'}>Active</Link>
        <Link href={`/${org}/projects?archived=1`} className={showArchived ? 'font-medium text-accent' : 'text-ink-2 hover:text-ink'}>Including archived</Link>
      </div>
      {projects.data.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-8 w-8" aria-hidden />} title="No projects yet" description={canManage ? 'Create a project, then add its website.' : 'A manager or admin needs to create the first project.'}>
          {canManage && <NewProjectDialog orgSlug={m.organization.slug} />}
        </EmptyState>
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>Name</Th><Th>Industry / market</Th><Th>Websites</Th><Th>Created</Th></tr></thead>
            <tbody>
              {projects.data.map((p) => (
                <tr key={p.id}>
                  <Td>
                    <Link href={`/${org}/projects/${p.id}`} className="font-medium text-accent hover:underline">{p.name}</Link>
                    {p.archived && <Badge className="ml-2">Archived</Badge>}
                  </Td>
                  <Td className="text-ink-2">{[p.industry, p.market].filter(Boolean).join(' · ') || '—'}</Td>
                  <Td>{p.websites?.length ?? 0}</Td>
                  <Td className="text-ink-2">{formatDate(p.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
