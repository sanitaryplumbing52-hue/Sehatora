'use client';

import { Archive, ArchiveRestore, MoreHorizontal, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownContent, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/ui/dropdown';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { api, unwrap } from '@/lib/api/client';
import { useSession } from '@/lib/permissions';
import { useAction } from '@/lib/use-action';

export function ProjectActions({ project, orgSlug }: { project: { id: string; name: string; archived: boolean }; orgSlug: string }) {
  const router = useRouter();
  const orgId = useSession().membership.organization.id;
  const { run, problem } = useAction();
  const path = { org: orgId, project: project.id };

  async function toggleArchive() {
    const res = await run(async () => unwrap(api.PATCH('/orgs/{org}/projects/{project}', { params: { path }, body: { archived: !project.archived } })));
    if (res.ok) router.refresh();
  }
  async function destroy() {
    if (!window.confirm(`Delete “${project.name}”? Its websites are removed too. This cannot be undone from the app.`)) return;
    const res = await run(async () => unwrap(api.DELETE('/orgs/{org}/projects/{project}', { params: { path } })));
    if (res.ok) {
      router.push(`/${orgSlug}/projects`);
      router.refresh();
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownTrigger asChild><Button variant="secondary" size="icon" aria-label="Project actions"><MoreHorizontal className="h-4 w-4" /></Button></DropdownTrigger>
        <DropdownContent align="end">
          <DropdownItem onSelect={() => void toggleArchive()}>
            {project.archived ? <ArchiveRestore className="h-4 w-4" aria-hidden /> : <Archive className="h-4 w-4" aria-hidden />}
            {project.archived ? 'Unarchive' : 'Archive'}
          </DropdownItem>
          <DropdownItem className="text-danger" onSelect={() => void destroy()}><Trash2 className="h-4 w-4" aria-hidden /> Delete project</DropdownItem>
        </DropdownContent>
      </DropdownMenu>
      {problem && <div className="fixed bottom-4 right-4 z-50 w-80"><ProblemAlert problem={problem} /></div>}
    </>
  );
}
