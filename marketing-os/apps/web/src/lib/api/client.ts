import createClient, { type Middleware } from 'openapi-fetch';
import { ApiError, problemFromBody } from './errors';
import type { paths } from './schema';

const XSRF_COOKIE = 'XSRF-TOKEN';

function readXsrf(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${XSRF_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(XSRF_COOKIE.length + 1)) : null;
}

let csrfPrimed: Promise<void> | null = null;
function primeCsrf(): Promise<void> {
  csrfPrimed ??= fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' })
    .then(() => undefined)
    .finally(() => {
      csrfPrimed = null;
    });
  return csrfPrimed;
}

/** Attaches the CSRF header to state-changing requests, fetching the cookie first if needed. */
export const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return request;
    if (!readXsrf()) await primeCsrf();
    const token = readXsrf();
    if (token) request.headers.set('X-XSRF-TOKEN', token);
    return request;
  },
};

export const api = createClient<paths>({
  baseUrl: '/api/v1',
  credentials: 'same-origin',
  headers: { Accept: 'application/json' },
});
api.use(csrfMiddleware);

/** Unwraps an openapi-fetch result, throwing ApiError with a normalised problem on failure. */
export async function unwrap<T>(
  call: Promise<{ data?: T; error?: unknown; response: Response }>,
): Promise<T> {
  let result;
  try {
    result = await call;
  } catch (e) {
    throw e instanceof ApiError ? e : new ApiError(problemFromBody(null, 0), 0);
  }
  if (result.error !== undefined || !result.response.ok) {
    throw new ApiError(problemFromBody(result.error, result.response.status), result.response.status);
  }
  return result.data as T;
}
