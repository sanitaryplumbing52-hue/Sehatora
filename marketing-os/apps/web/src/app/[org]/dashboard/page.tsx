import type { Metadata } from 'next';
import Link from 'next/link';
import { Circle, CircleCheck } from 'lucide-react';
import { MetricCard } from '@/components/data/metric-card';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { serverApi, unwrapServer } from '@/lib/api/server';
import { FirstRun } from './first-run';
import { ProjectSwitcher } from './project-switcher';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage({ params, searchParams }: { params: Promise<{ org: string }>; searchParams: Promise<{ project?: string }> }) {
  const { org } = await params;
  const { project: projectParam } = await searchParams;
  const api = await serverApi();
  const orgs = await unwrapServer(api.GET('/me/organizations'));
  const membership = orgs.data.find((m) => m.organization.slug === org || m.organization.id === org);
  if (!membership) return null; // layout already 404s
  const orgId = membership.organization.id;

  const projects = await unwrapServer(api.GET('/orgs/{org}/projects', { params: { path: { org: orgId }, query: { per_page: 100 } } }));
  if (projects.data.length === 0) return <FirstRun orgSlug={membership.organization.slug} canCreate={membership.permissions.includes('projects.manage')} />;

  const selected = projects.data.find((p) => p.id === projectParam) ?? projects.data[0]!;
  const overview = await unwrapServer(api.GET('/orgs/{org}/projects/{project}/dashboard/overview', { params: { path: { org: orgId, project: selected.id } } }));
  const anyConnected = overview.data.metrics.some((m) => m.status !== 'not_connected');
  const pending = overview.data.onboarding.filter((o) => !o.done);

  return (
    <>
      <PageHeader
        title="Executive overview"
        description={anyConnected ? 'Metrics from your connected sources.' : 'Your marketing data will appear here once connected. Nothing on this page is estimated or sample data.'}
        actions={<ProjectSwitcher projects={projects.data.map((p) => ({ id: p.id, name: p.name }))} selectedId={selected.id} />}
      />

      {pending.length > 0 && (
        <Card className="mb-6">
          <CardHeader title="Set up this project" description="Connect your data to replace “Not connected” with real numbers." />
          <CardBody>
            <ul className="grid gap-2 sm:grid-cols-2">
              {overview.data.onboarding.map((o) => (
                <li key={o.key} className="flex items-center gap-2 text-sm">
                  {o.done ? <CircleCheck className="h-4 w-4 text-ok" aria-label="Done" /> : <Circle className="h-4 w-4 text-ink-3" aria-label="Not done" />}
                  {o.key === 'website' ? (
                    <Link className={o.done ? 'text-ink-2' : 'text-accent underline underline-offset-2'} href={`/${org}/projects/${selected.id}`}>{o.label}</Link>
                  ) : (
                    <Link className="text-ink-2 hover:text-ink" href={`/${org}/integrations`}>{o.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {overview.data.metrics.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </section>
    </>
  );
}
