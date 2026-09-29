'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CreateProjectForm } from './create-project-form';

export function NewProjectDialog({ orgSlug }: { orgSlug: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" aria-hidden /> New project</Button>
      </DialogTrigger>
      <DialogContent title="New project" description="You can add more websites and connect data sources afterwards.">
        <CreateProjectForm orgSlug={orgSlug} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
