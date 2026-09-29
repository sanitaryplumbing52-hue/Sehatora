import type { Metadata } from 'next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, PageHeader } from '@/components/ui/card';
import { serverApi, unwrapServer } from '@/lib/api/server';

export const metadata: Metadata = { title: 'Integrations' };

export default async function IntegrationsPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const api = await serverApi();
  const orgs = await unwrapServer(api.GET('/me/organizations'));
  const m = orgs.data.find((x) => x.organization.slug === org || x.organization.id === org);
  if (!m) return null;
  const providers = await unwrapServer(api.GET('/orgs/{org}/integrations', { params: { path: { org: m.organization.id } } }));
  const canManage = m.permissions.includes('integrations.manage');

  return (
    <>
      <PageHeader title="Integrations" description="Connect the platforms Marketing OS reads from. Until a source is connected, its metrics show “Not connected” — never estimates." />
      <div className="grid gap-4 sm:grid-cols-2">
        {providers.data.map((p) => (
          <Card key={p.key}>
            <CardBody className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{p.name}</h2>
                <p className="mt-0.5 text-xs capitalize text-ink-3">{p.category}</p>
                {p.unavailable_reason && <p className="mt-2 text-sm text-ink-2">{p.unavailable_reason}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge tone="neutral">{p.status === 'not_connected' ? 'Not connected' : p.status}</Badge>
                <Button size="sm" variant="secondary" disabled title={p.available ? undefined : (p.unavailable_reason ?? 'Not available yet')}>
                  {canManage ? 'Connect' : 'Connect (admin)'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
