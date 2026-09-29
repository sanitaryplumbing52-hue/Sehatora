import { Circle } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/card';
import { CreateProjectForm } from '../projects/create-project-form';

const SOURCES = ['Google Analytics', 'Search Console', 'Google Ads', 'Meta Ads'];

export function FirstRun({ orgSlug, canCreate }: { orgSlug: string; canCreate: boolean }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Welcome to Marketing Intelligence OS</h1>
        <p className="mt-2 text-ink-2">
          {canCreate ? 'Create your first project to get started.' : 'No projects exist yet. Ask an admin or manager to create one.'}
        </p>
      </div>
      {canCreate && (
        <Card>
          <CardBody>
            <CreateProjectForm orgSlug={orgSlug} withWebsite />
          </CardBody>
        </Card>
      )}
      <Card>
        <CardBody>
          <h2 className="text-sm font-semibold text-ink">Then connect your data</h2>
          <ul className="mt-3 space-y-2">
            {SOURCES.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-ink-2"><Circle className="h-4 w-4 text-ink-3" aria-hidden /> {s}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-3">Your marketing data will appear here once connected. No fake numbers, no sample charts.</p>
        </CardBody>
      </Card>
    </div>
  );
}
