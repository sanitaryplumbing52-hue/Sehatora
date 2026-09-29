'use client';

import { useCallback, useState } from 'react';
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError, toProblem, type Problem } from '@/lib/api/errors';

/** Runs an async action tracking pending + a user-presentable problem. Field-level API errors are mapped onto the form. */
export function useAction<TValues extends FieldValues = FieldValues>(setError?: UseFormSetError<TValues>) {
  const [pending, setPending] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);

  const run = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> => {
      setPending(true);
      setProblem(null);
      try {
        return { ok: true, value: await fn() };
      } catch (e) {
        const fields = e instanceof ApiError ? e.fieldErrors() : {};
        const mapped = Object.keys(fields);
        if (setError && mapped.length > 0) {
          for (const [field, message] of Object.entries(fields)) setError(field as Path<TValues>, { type: 'server', message });
          // Field errors are shown inline; only surface a banner for non-validation failures.
          if (!(e instanceof ApiError && (e.code === 'validation_failed' || e.code === 'invalid_credentials' || e.code === 'invalid_two_factor_code'))) setProblem(toProblem(e));
        } else {
          setProblem(toProblem(e));
        }
        return { ok: false };
      } finally {
        setPending(false);
      }
    },
    [setError],
  );

  return { run, pending, problem, clearProblem: () => setProblem(null) };
}
