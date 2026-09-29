import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { csrfMiddleware, unwrap } from './client';
import { ApiError } from './errors';

function ctx(method: string) {
  return { request: new Request('http://localhost/api/v1/x', { method }) } as Parameters<NonNullable<typeof csrfMiddleware.onRequest>>[0];
}

describe('csrf middleware', () => {
  beforeEach(() => {
    document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
  afterEach(() => vi.restoreAllMocks());

  it('adds the decoded XSRF token to mutating requests', async () => {
    document.cookie = `XSRF-TOKEN=${encodeURIComponent('abc=def')}; path=/`;
    const req = (await csrfMiddleware.onRequest!(ctx('POST'))) as Request;
    expect(req.headers.get('X-XSRF-TOKEN')).toBe('abc=def');
  });

  it('does not touch safe methods', async () => {
    const req = (await csrfMiddleware.onRequest!(ctx('GET'))) as Request;
    expect(req.headers.has('X-XSRF-TOKEN')).toBe(false);
  });

  it('fetches the csrf cookie first when missing', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      document.cookie = 'XSRF-TOKEN=fresh; path=/';
      return new Response(null, { status: 204 });
    });
    const req = (await csrfMiddleware.onRequest!(ctx('DELETE'))) as Request;
    expect(fetchSpy).toHaveBeenCalledWith('/sanctum/csrf-cookie', { credentials: 'same-origin' });
    expect(req.headers.get('X-XSRF-TOKEN')).toBe('fresh');
  });
});

describe('unwrap', () => {
  it('returns data on success', async () => {
    await expect(unwrap(Promise.resolve({ data: { ok: 1 }, response: new Response(null, { status: 200 }) }))).resolves.toEqual({ ok: 1 });
  });
  it('throws ApiError carrying the problem on failure', async () => {
    const problem = { type: 't', title: 'Nope', status: 403, code: 'forbidden' };
    await expect(unwrap(Promise.resolve({ error: problem, response: new Response(null, { status: 403 }) }))).rejects.toMatchObject({ httpStatus: 403, problem });
  });
  it('wraps network failures in a safe ApiError', async () => {
    const err = await unwrap(Promise.reject(new TypeError('Failed to fetch'))).catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.problem.detail).not.toContain('Failed to fetch');
  });
});
