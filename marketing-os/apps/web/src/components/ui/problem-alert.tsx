import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import type { Problem } from '@/lib/api/errors';

/**
 * Renders an API problem the way the product promises: what failed, why, and what to do next.
 * Never shows raw exception text; the request id is offered for support.
 */
export function ProblemAlert({ problem }: { problem: Problem }) {
  return (
    <div role="alert" className="flex gap-3 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
      <div className="min-w-0 space-y-1">
        <p className="font-medium text-danger">{problem.title}</p>
        {problem.detail && <p className="text-ink-2">{problem.detail}</p>}
        {problem.action && (
          <Link href={problem.action.href} className="inline-block font-medium text-accent underline underline-offset-2">
            {problem.action.label}
          </Link>
        )}
        {problem.request_id && <p className="text-xs text-ink-3">Reference: <span className="font-mono">{problem.request_id}</span></p>}
      </div>
    </div>
  );
}
