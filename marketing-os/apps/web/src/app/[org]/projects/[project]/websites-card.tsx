'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Field, Input } from '@/components/ui/field';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { Table, Td, Th } from '@/components/ui/table';
import { api, unwrap } from '@/lib/api/client';
import type { components } from '@/lib/api/schema';
import { useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';
import { websiteUrlSchema } from '@/lib/validation';

type Website = components['schemas']['Website'];
const schema = z.object({ url: websiteUrlSchema });
type Values = z.infer<typeof schema>;

export function WebsitesCard({ projectId, websites, canManage }: { projectId: string; websites: Website[]; canManage: boolean }) {
  const router = useRouter();
  const orgId = useSession().membership.organization.id;
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { url: '' } });
  const add = useAction<Values>(form.setError);
  const remove = useAction();

  async function onAdd(values: Values) {
    const res = await add.run(async () => unwrap(api.POST('/orgs/{org}/projects/{project}/websites', { params: { path: { org: orgId, project: projectId } }, body: { url: values.url } })));
    if (res.ok) {
      form.reset();
      router.refresh();
    }
  }

  async function onRemove(w: Website) {
    if (!window.confirm(`Remove ${w.url} from this project? Its domain can be re-added later.`)) return;
    const res = await remove.run(async () => unwrap(api.DELETE('/orgs/{org}/projects/{project}/websites/{website}', { params: { path: { org: orgId, project: projectId, website: w.id } } })));
    if (res.ok) router.refresh();
  }

  return (
    <Card>
      <CardHeader title="Websites" description="Domains are normalised to their origin; each domain can be added once per organization." />
      <CardBody className="space-y-4">
        {remove.problem && <ProblemAlert problem={remove.problem} />}
        {websites.length === 0 ? (
          <EmptyState icon={<Globe className="h-8 w-8" aria-hidden />} title="No website yet" description="Add a website to enable audits and connect its analytics sources." />
        ) : (
          <Table>
            <thead><tr><Th>Website</Th><Th>Domain</Th><Th>Ownership</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
            <tbody>
              {websites.map((w) => (
                <tr key={w.id}>
                  <Td className="font-medium">{w.url}</Td>
                  <Td className="font-mono text-xs text-ink-2">{w.domains?.[0]?.host ?? '—'}</Td>
                  <Td><Badge tone="neutral">Not verified</Badge></Td>
                  <Td className="text-right">
                    {canManage && <Button variant="ghost" size="sm" onClick={() => void onRemove(w)} aria-label={`Remove ${w.url}`}><Trash2 className="h-4 w-4" aria-hidden /></Button>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        {canManage && (
          <form onSubmit={form.handleSubmit(onAdd)} className="flex flex-col gap-3 sm:flex-row sm:items-start" noValidate>
            <Field label="Add a website" error={form.formState.errors.url?.message} className="flex-1">
              {(a) => <Input {...a} placeholder="example.com" inputMode="url" {...form.register('url')} />}
            </Field>
            <Button type="submit" loading={add.pending} className="sm:mt-6">Add website</Button>
          </form>
        )}
        {add.problem && <ProblemAlert problem={add.problem} />}
      </CardBody>
    </Card>
  );
}
