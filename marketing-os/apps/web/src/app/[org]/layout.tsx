import { notFound, redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { Shell } from '@/components/layout/shell';
import { serverApi, unwrapServer } from '@/lib/api/server';
import { SessionProvider } from '@/lib/permissions';

export default async function OrgLayout({ children, params }: { children: ReactNode; params: Promise<{ org: string }> }) {
  const { org } = await params;
  const api = await serverApi();
  const [me, memberships] = await Promise.all([unwrapServer(api.GET('/me')), unwrapServer(api.GET('/me/organizations'))]);
  if (!me.data.email_verified) redirect('/verify-email');

  const membership = memberships.data.find((m) => m.organization.slug === org || m.organization.id === org);
  if (!membership) notFound();

  const projects = await unwrapServer(api.GET('/orgs/{org}/projects', { params: { path: { org: membership.organization.id }, query: { per_page: 100 } } }));

  return (
    <SessionProvider value={{ user: me.data, membership, memberships: memberships.data }}>
      <Shell projects={projects.data.map((p) => ({ id: p.id, name: p.name }))}>{children}</Shell>
    </SessionProvider>
  );
}
