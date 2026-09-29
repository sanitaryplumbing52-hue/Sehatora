'use client';

import { Button } from '@/components/ui/button';
import { ProblemAlert } from '@/components/ui/problem-alert';
import { ApiError, toProblem } from '@/lib/api/errors';

export default function OrgError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Server-thrown errors lose their class across the boundary; show a safe message plus the digest as a reference.
  const problem = error instanceof ApiError ? error.problem : { ...toProblem(error), title: 'This page could not be loaded.', detail: 'Try again. If it keeps failing, contact support with the reference below.', request_id: error.digest ?? null };
  return (
    <div className="mx-auto max-w-lg space-y-4 py-10">
      <ProblemAlert problem={{ ...problem, request_id: problem.request_id ?? undefined }} />
      <Button variant="secondary" onClick={reset}>Try again</Button>
    </div>
  );
}
