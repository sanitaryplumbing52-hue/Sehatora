import type { Metadata } from 'next';
import Link from 'next/link';
import { Globe } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, Td, Th } from '@/components/ui/table';
import { serverApi, unwrapServer } from '@/lib/api/server';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Websites' };

export default async function WebsitesPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const api = await serverApi();
  const orgs = await unwrapServer(api.GET('/me/organizations'));
  const m = orgs.data.find((x) => x.organization.slug === org || x.organization.id === org);
  if (!m) return null;
  const projects = await unwrapServer(api.GET('/orgs/{org}/projects', { params: { path: { org: m.organization.id }, query: { per_page: 100 } } }));
  const rows = projects.data.flatMap((p) => (p.websites ?? []).map((w) => ({ ...w, projectName: p.name })));

  return (
    <>
      <PageHeader title="Websites" description="Every website across your active projects. Audits and crawls arrive in Phase 2." />
      {rows.length === 0 ? (
        <EmptyState icon={<Globe className="h-8 w-8" aria-hidden />} title="No websites yet" description="Add a website from a project page.">
          <Link className="text-sm text-accent underline underline-offset-2" href={`/${org}/projects`}>Go to projects</Link>
        </EmptyState>
      ) : (
        <Card>
          <Table>
            <thead><tr><Th>Website</Th><Th>Project</Th><Th>CMS</Th><Th>Added</Th></tr></thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.id}>
                  <Td className="font-medium">{w.url}</Td>
                  <Td><Link className="text-accent hover:underline" href={`/${org}/projects/${w.project_id}`}>{w.projectName}</Link></Td>
                  <Td className="capitalize text-ink-2">{w.cms}</Td>
                  <Td className="text-ink-2">{formatDate(w.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}
