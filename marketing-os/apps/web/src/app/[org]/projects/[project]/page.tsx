import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/card';
import { ApiError } from '@/lib/api/errors';
import { serverApi, unwrapServer } from '@/lib/api/server';
import { ProjectActions } from './project-actions';
import { ProjectSettingsForm } from './project-settings-form';
import { WebsitesCard } from './websites-card';

export const metadata: Metadata = { title: 'Project' };

export default async function ProjectPage({ params }: { params: Promise<{ org: string; project: string }> }) {
  const { org, project: projectId } = await params;
  const api = await serverApi();
  const orgs = await unwrapServer(api.GET('/me/organizations'));
  const m = orgs.data.find((x) => x.organization.slug === org || x.organization.id === org);
  if (!m) notFound();

  let project;
  try {
    project = (await unwrapServer(api.GET('/orgs/{org}/projects/{project}', { params: { path: { org: m.organization.id, project: projectId } } }))).data;
  } catch (e) {
    if (e instanceof ApiError && e.httpStatus === 404) notFound();
    throw e;
  }
  const canManage = m.permissions.includes('projects.manage');

  return (
    <>
      <PageHeader
        title={<>{project.name} {project.archived && <Badge className="ml-2 align-middle">Archived</Badge>}</>}
        description={[project.industry, project.market].filter(Boolean).join(' · ') || 'Project'}
        actions={<>
          <Link href={`/${org}/dashboard?project=${project.id}`} className="text-sm text-accent underline underline-offset-2">View dashboard</Link>
          {canManage && <ProjectActions project={{ id: project.id, name: project.name, archived: project.archived }} orgSlug={org} />}
        </>}
      />
      <div className="space-y-6">
        <WebsitesCard projectId={project.id} websites={project.websites ?? []} canManage={canManage} />
        {canManage && (
          <Card>
            <CardHeader title="Project details" />
            <CardBody>
              <ProjectSettingsForm project={{ id: project.id, name: project.name, industry: project.industry ?? '', market: project.market ?? '', goals: project.goals ?? [] }} />
            </CardBody>
          </Card>
        )}
      </div>
    </>
  );
}
