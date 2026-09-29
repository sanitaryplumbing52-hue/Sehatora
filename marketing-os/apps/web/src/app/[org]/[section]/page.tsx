import { CalendarClock } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { findNavItem } from '@/lib/nav';

/** Honest placeholder for modules that ship in later phases. No mock data, no fake charts. */
export default async function PlannedModule({ params }: { params: Promise<{ org: string; section: string }> }) {
  const { org, section } = await params;
  const item = findNavItem(section);
  if (!item || item.built) notFound();
  return (
    <>
      <PageHeader title={item.label} description={item.description} />
      <EmptyState
        icon={<CalendarClock className="h-8 w-8" aria-hidden />}
        title={item.phase ? `${item.label} arrives in Phase ${item.phase}` : `${item.label} is not scheduled yet`}
        description="This module is intentionally empty. It will only ever show data from connected sources — never placeholder numbers."
      >
        <Button asChild variant="secondary"><Link href={`/${org}/dashboard`}>Back to dashboard</Link></Button>
      </EmptyState>
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return { title: findNavItem(section)?.label ?? 'Not found' };
}
