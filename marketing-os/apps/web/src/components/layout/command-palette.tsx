'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ALL_NAV_ITEMS } from '@/lib/nav';

export type PaletteProject = { id: string; name: string };

/** Cmd/Ctrl+K navigation. Searches modules and projects that exist today; nothing is faked for modules that don't. */
export function CommandPalette({ orgSlug, projects }: { orgSlug: string; projects: PaletteProject[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-label="Open search" className="w-9 px-0 text-ink-3 sm:w-56 sm:justify-between sm:px-3">
        <span className="flex items-center gap-2"><Search className="h-3.5 w-3.5" aria-hidden /><span className="hidden sm:inline">Search…</span></span>
        <kbd className="hidden rounded border border-line px-1.5 text-[10px] sm:inline">⌘K</kbd>
      </Button>
      <RadixDialog.Root open={open} onOpenChange={setOpen}>
        <RadixDialog.Portal>
          <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
          <RadixDialog.Content aria-label="Search" className="fixed left-1/2 top-[15vh] z-50 w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface shadow-xl">
            <RadixDialog.Title className="sr-only">Search</RadixDialog.Title>
            <RadixDialog.Description className="sr-only">Jump to a module or project</RadixDialog.Description>
            <Command label="Search">
              <Command.Input placeholder="Jump to a module or project…" className="h-11 w-full border-b border-line bg-transparent px-4 text-sm text-ink outline-none placeholder:text-ink-3" />
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-ink-3">No matches.</Command.Empty>
                {projects.length > 0 && (
                  <Command.Group heading="Projects" className="text-xs text-ink-3 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                    {projects.map((p) => (
                      <Item key={p.id} value={`project ${p.name}`} onSelect={() => go(`/${orgSlug}/projects/${p.id}`)}>{p.name}</Item>
                    ))}
                  </Command.Group>
                )}
                <Command.Group heading="Modules" className="text-xs text-ink-3 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1">
                  {ALL_NAV_ITEMS.map((i) => (
                    <Item key={i.slug} value={`module ${i.label}`} onSelect={() => go(`/${orgSlug}/${i.slug}`)}>
                      {i.label}
                      {!i.built && <span className="ml-auto text-[10px] text-ink-3">{i.phase ? `Phase ${i.phase}` : 'Later'}</span>}
                    </Item>
                  ))}
                </Command.Group>
              </Command.List>
              <p className="border-t border-line px-4 py-2 text-xs text-ink-3">
                Searching keywords, pages, campaigns and reports arrives with those modules.
              </p>
            </Command>
          </RadixDialog.Content>
        </RadixDialog.Portal>
      </RadixDialog.Root>
    </>
  );
}

function Item({ children, value, onSelect }: { children: React.ReactNode; value: string; onSelect: () => void }) {
  return (
    <Command.Item value={value} onSelect={onSelect} className="flex cursor-pointer items-center rounded px-2 py-2 text-sm text-ink data-[selected=true]:bg-surface-2">
      {children}
    </Command.Item>
  );
}
