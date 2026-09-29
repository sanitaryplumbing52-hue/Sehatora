'use client';

import * as RadixDialog from '@radix-ui/react-dialog';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/permissions';
import { CommandPalette, type PaletteProject } from './command-palette';
import { OrgSwitcher } from './org-switcher';
import { Sidebar } from './sidebar';
import { UserMenu } from './user-menu';

export function Shell({ projects, children }: { projects: PaletteProject[]; children: ReactNode }) {
  const { membership } = useSession();
  const slug = membership.organization.slug;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[15rem_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">
        <div className="flex h-14 items-center border-b border-line px-4">
          <Link href={`/${slug}/dashboard`} className="text-sm font-semibold tracking-tight text-ink">
            Marketing Intelligence OS
          </Link>
        </div>
        <div className="h-[calc(100vh-3.5rem)]"><Sidebar orgSlug={slug} /></div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:px-5">
          <RadixDialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <RadixDialog.Trigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button>
            </RadixDialog.Trigger>
            <RadixDialog.Portal>
              <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
              <RadixDialog.Content className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-surface shadow-xl lg:hidden" aria-label="Navigation">
                <RadixDialog.Title className="sr-only">Navigation</RadixDialog.Title>
                <RadixDialog.Description className="sr-only">Main navigation</RadixDialog.Description>
                <div className="flex h-14 items-center justify-between border-b border-line px-4">
                  <span className="text-sm font-semibold">Marketing Intelligence OS</span>
                  <RadixDialog.Close aria-label="Close navigation" className="rounded p-1 hover:bg-surface-2"><X className="h-4 w-4" /></RadixDialog.Close>
                </div>
                <div className="h-[calc(100%-3.5rem)]"><Sidebar orgSlug={slug} onNavigate={() => setMobileOpen(false)} /></div>
              </RadixDialog.Content>
            </RadixDialog.Portal>
          </RadixDialog.Root>

          <OrgSwitcher />
          <div className="ml-auto flex items-center gap-2">
            <CommandPalette orgSlug={slug} projects={projects} />
            <UserMenu />
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
