'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from '@/lib/nav';
import { cn } from '@/lib/utils';

export function Sidebar({ orgSlug, onNavigate }: { orgSlug: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex h-full flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-ink-3">{group.label}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const href = `/${orgSlug}/${item.slug}`;
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center justify-between rounded-md px-2 py-1.5 text-sm',
                      active ? 'bg-accent-soft font-medium text-accent' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )}
                  >
                    <span>{item.label}</span>
                    {!item.built && (
                      <span className="text-[10px] font-normal text-ink-3" title={item.phase ? `Planned for Phase ${item.phase}` : 'Not yet scheduled'}>
                        {item.phase ? `P${item.phase}` : 'Later'}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
