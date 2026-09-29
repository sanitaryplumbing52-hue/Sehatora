'use client';

import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { DropdownContent, DropdownItem, DropdownLabel, DropdownMenu, DropdownSeparator, DropdownTrigger } from '@/components/ui/dropdown';
import { useSession } from '@/lib/permissions';

export function OrgSwitcher() {
  const { membership, memberships } = useSession();
  return (
    <DropdownMenu>
      <DropdownTrigger className="flex min-w-0 max-w-64 items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-surface-2" aria-label="Switch organization">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent text-xs font-semibold text-accent-ink" aria-hidden>
          {membership.organization.name.charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-ink">{membership.organization.name}</span>
          <span className="block truncate text-[11px] text-ink-3">{membership.role.name}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-ink-3" aria-hidden />
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>Organizations</DropdownLabel>
        {memberships.map((m) => (
          <DropdownItem key={m.organization.id} asChild>
            <Link href={`/${m.organization.slug}/dashboard`}>
              <span className="flex-1 truncate">{m.organization.name}</span>
              <span className="text-xs text-ink-3">{m.role.name}</span>
              {m.organization.id === membership.organization.id && <Check className="h-4 w-4 text-accent" aria-label="Current" />}
            </Link>
          </DropdownItem>
        ))}
        <DropdownSeparator />
        <DropdownItem asChild>
          <Link href="/onboarding/organization">
            <Plus className="h-4 w-4" aria-hidden /> New organization
          </Link>
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}
