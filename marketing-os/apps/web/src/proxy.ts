import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'mios_session';
const PUBLIC_PREFIXES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/invitations'];

/**
 * 1. Per-request CSP nonce (strict script policy).
 * 2. Cheap "is there a session cookie at all" gate. This is a UX shortcut, not security: every
 *    server render re-validates the session against the API and the API authorises every call.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiOrInternal = pathname.startsWith('/api/') || pathname.startsWith('/sanctum/') || pathname.startsWith('/_next/');
  if (isApiOrInternal) return NextResponse.next();

  const isPublic = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPublic && !request.cookies.has(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = pathname === '/' ? '' : `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const dev = process.env.NODE_ENV === 'development';
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'", // Radix positions popovers with inline style attributes
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');

  const headers = new Headers(request.headers);
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [{ source: '/((?!_next/static|_next/image|favicon.ico).*)', missing: [{ type: 'header', key: 'next-router-prefetch' }, { type: 'header', key: 'purpose', value: 'prefetch' }] }],
};
