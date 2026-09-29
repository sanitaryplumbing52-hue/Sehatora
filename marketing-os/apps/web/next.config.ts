import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

// The browser only ever talks to this origin. /api and /sanctum are proxied to Laravel, so session
// cookies are first-party, no CORS is needed, and the API base URL never reaches client code.
const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://127.0.0.1:8000';

const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev-only: lets Playwright / 127.0.0.1 access dev assets and HMR (ignored in production).
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  turbopack: { root: fileURLToPath(new URL('.', import.meta.url)) },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/sanctum/:path*', destination: `${apiOrigin}/sanctum/:path*` },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default config;
