import type { components } from './schema';

export type Problem = components['schemas']['Problem'];

/** A structured, user-presentable API failure (RFC 9457 problem details). */
export class ApiError extends Error {
  constructor(
    public readonly problem: Problem,
    public readonly httpStatus: number,
  ) {
    super(problem.title);
    this.name = 'ApiError';
  }

  get code() {
    return this.problem.code;
  }

  /** field -> first message, for mapping onto form fields */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [field, messages] of Object.entries(this.problem.errors ?? {})) {
      const first = messages[0];
      if (first) out[field] = first;
    }
    return out;
  }
}

/** Normalises anything thrown by a request (API problem, network failure, garbage) into a Problem. */
export function toProblem(error: unknown): Problem {
  if (error instanceof ApiError) return error.problem;
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  return {
    type: 'about:blank',
    title: offline ? 'You appear to be offline.' : 'We could not reach the server.',
    status: 0,
    code: 'network_error',
    detail: offline ? 'Check your connection and try again.' : 'Try again in a moment. If this keeps happening, contact support.',
  };
}

/** Parses an error response body defensively — proxies and gateways may return non-JSON. */
export function problemFromBody(body: unknown, status: number): Problem {
  if (body && typeof body === 'object' && 'code' in body && 'title' in body) return body as Problem;
  return {
    type: 'about:blank',
    title: status >= 500 ? 'The service had a problem handling your request.' : 'The request could not be completed.',
    status,
    code: status >= 500 ? 'server_error' : 'http_error',
    detail: 'Try again shortly.',
  };
}
