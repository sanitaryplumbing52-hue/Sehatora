'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

export const DropdownMenu = Menu.Root;
export const DropdownTrigger = Menu.Trigger;
export const DropdownLabel = ({ className, ...p }: ComponentProps<typeof Menu.Label>) => (
  <Menu.Label className={cn('px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-3', className)} {...p} />
);
export const DropdownSeparator = () => <Menu.Separator className="my-1 h-px bg-line" />;

export function DropdownContent({ className, ...p }: ComponentProps<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align="start"
        sideOffset={6}
        className={cn('z-50 min-w-56 rounded-md border border-line bg-surface p-1 shadow-lg', className)}
        {...p}
      />
    </Menu.Portal>
  );
}

export function DropdownItem({ className, ...p }: ComponentProps<typeof Menu.Item>) {
  return (
    <Menu.Item
      className={cn('flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-ink outline-none data-[highlighted]:bg-surface-2', className)}
      {...p}
    />
  );
}
