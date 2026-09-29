'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ApiError } from '@/lib/api/errors';

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => !(err instanceof ApiError && err.httpStatus >= 400 && err.httpStatus < 500) && count < 2,
          },
        },
      }),
  );
  // Marks the document once React has hydrated (used by e2e tests to avoid racing native form submits).
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
