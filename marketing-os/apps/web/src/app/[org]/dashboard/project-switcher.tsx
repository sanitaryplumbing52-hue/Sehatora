'use client';

import { useRouter } from 'next/navigation';
import { Select } from '@/components/ui/field';

export function ProjectSwitcher({ projects, selectedId }: { projects: { id: string; name: string }[]; selectedId: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      <span className="sr-only sm:not-sr-only">Project</span>
      <Select value={selectedId} onChange={(e) => router.push(`?project=${e.target.value}`)} className="w-56" aria-label="Project">
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
    </label>
  );
}
