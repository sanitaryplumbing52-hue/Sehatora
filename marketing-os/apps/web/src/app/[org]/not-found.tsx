import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md space-y-3 py-16 text-center">
      <h1 className="text-lg font-semibold">We couldn&apos;t find that</h1>
      <p className="text-sm text-ink-2">It may not exist, or you may not have access to it.</p>
      <Button asChild variant="secondary"><Link href="/">Go home</Link></Button>
    </div>
  );
}
