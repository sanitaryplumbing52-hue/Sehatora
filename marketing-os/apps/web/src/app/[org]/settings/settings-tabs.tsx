'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCan } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export function SettingsTabs({ orgSlug }: { orgSlug: string }) {
  const pathname = usePathname();
  const can = useCan();
  const tabs = [
    { slug: 'general', label: 'Organization', show: true },
    { slug: 'members', label: 'Members', show: can('members.view') },
    { slug: 'audit-log', label: 'Audit log', show: can('audit.view') },
    { slug: 'account', label: 'Account', show: true },
    { slug: 'security', label: 'Security', show: true },
  ];
  return (
    <nav aria-label="Settings" className="flex gap-1 overflow-x-auto border-b border-line">
      {tabs.filter((t) => t.show).map((t) => {
        const href = `/${orgSlug}/settings/${t.slug}`;
        const active = pathname === href;
        return (
          <Link key={t.slug} href={href} aria-current={active ? 'page' : undefined}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm', active ? 'border-accent font-medium text-accent' : 'border-transparent text-ink-2 hover:text-ink')}>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
