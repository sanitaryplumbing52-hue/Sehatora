import 'server-only';
import createClient from 'openapi-fetch';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ApiError, problemFromBody } from './errors';
import type { paths } from './schema';

const base = `${process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8000'}/api/v1`;

/** Server-side API client that forwards the visitor's session cookie to Laravel. */
export async function serverApi() {
  const jar = await cookies();
  const cookie = jar.getAll().map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join('; ');
  return createClient<paths>({
    baseUrl: base,
    cache: 'no-store',
    headers: { Accept: 'application/json', Cookie: cookie },
  });
}

/**
 * Unwraps a server-side result. 401 -> login, 403 email_unverified -> verify page;
 * anything else throws ApiError for the nearest error boundary.
 */
export async function unwrapServer<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
  opts: { nextPath?: string } = {},
): Promise<T> {
  const { data, error, response } = await call;
  if (response.ok && error === undefined) return data as T;
  if (response.status === 401) redirect(`/login${opts.nextPath ? `?next=${encodeURIComponent(opts.nextPath)}` : ''}`);
  const problem = problemFromBody(error, response.status);
  if (response.status === 403 && problem.code === 'email_unverified') redirect('/verify-email');
  throw new ApiError(problem, response.status);
}
