'use client';

import { LogOut, Settings, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown';
import { api } from '@/lib/api/client';
import { useSession } from '@/lib/permissions';
import { hardNavigate } from '@/lib/navigate';

export function UserMenu() {
  const { user, membership } = useSession();
  const slug = membership.organization.slug;

  async function signOut() {
    try {
      await api.POST('/auth/logout');
    } finally {
      hardNavigate('/login');
    }
  }

  return (
    <DropdownMenu>
      <DropdownTrigger className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent" aria-label="Account menu">
        {user.name.charAt(0).toUpperCase()}
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownLabel>
          <span className="block normal-case tracking-normal text-ink">{user.name}</span>
          <span className="block normal-case tracking-normal">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href={`/${slug}/settings/account`}><Settings className="h-4 w-4" aria-hidden /> Account</Link>
        </DropdownItem>
        <DropdownItem asChild>
          <Link href={`/${slug}/settings/security`}><ShieldCheck className="h-4 w-4" aria-hidden /> Security</Link>
        </DropdownItem>
        <DropdownSeparator />
        <DropdownItem onSelect={() => void signOut()}>
          <LogOut className="h-4 w-4" aria-hidden /> Sign out
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}
