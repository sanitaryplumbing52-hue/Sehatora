import { describe, expect, it } from 'vitest';
import { ApiError, problemFromBody, toProblem } from './api/errors';
import { formatMetricValue, formatRelativeTime } from './format';
import { findNavItem, NAV } from './nav';
import { safeNextPath } from './safe-redirect';
import { emailSchema, passwordSchema, websiteUrlSchema } from './validation';

describe('safeNextPath', () => {
  it.each([
    ['/acme/dashboard', '/acme/dashboard'],
    ['/invitations/accept?token=abc', '/invitations/accept?token=abc'],
    ['//evil.com', '/'],
    ['https://evil.com', '/'],
    ['/\\evil.com', '/'],
    ['javascript:alert(1)', '/'],
    ['', '/'],
    [null, '/'],
    ['/ok\r\nSet-Cookie: x=1', '/'],
  ])('%s -> %s', (input, expected) => expect(safeNextPath(input as string | null)).toBe(expected));
});

describe('validation', () => {
  it('password rules mirror the API', () => {
    expect(passwordSchema.safeParse('short1').success).toBe(false);
    expect(passwordSchema.safeParse('onlyletterslong').success).toBe(false);
    expect(passwordSchema.safeParse('123456789012').success).toBe(false);
    expect(passwordSchema.safeParse('correct-horse-9').success).toBe(true);
  });
  it('email', () => {
    expect(emailSchema.safeParse('a@b.co').success).toBe(true);
    expect(emailSchema.safeParse('nope').success).toBe(false);
  });
  it.each(['example.com', 'https://www.example.com/path', 'http://shop.example.co.uk:8080'])('accepts %s', (v) => expect(websiteUrlSchema.safeParse(v).success).toBe(true));
  it.each(['', 'localhost', '192.168.0.1', 'ftp://example.com', 'not a url', 'javascript:alert(1)'])('rejects %j', (v) => expect(websiteUrlSchema.safeParse(v).success).toBe(false));
});

describe('format', () => {
  it('formatMetricValue returns null without a value', () => {
    expect(formatMetricValue({ value: null, unit: 'count', currency: null })).toBeNull();
  });
  it('formats relative time', () => {
    const now = new Date('2026-09-29T12:00:00Z');
    expect(formatRelativeTime('2026-09-29T10:00:00Z', now)).toBe('2 hours ago');
    expect(formatRelativeTime('2026-09-29T11:48:00Z', now)).toBe('12 minutes ago');
    expect(formatRelativeTime(null, now)).toBeNull();
    expect(formatRelativeTime('garbage', now)).toBeNull();
  });
});

describe('api errors', () => {
  it('maps field errors from a validation problem', () => {
    const err = new ApiError({ type: 't', title: 'Invalid', status: 422, code: 'validation_failed', errors: { email: ['Taken.', 'x'], name: [] } }, 422);
    expect(err.fieldErrors()).toEqual({ email: 'Taken.' });
  });
  it('never leaks unstructured bodies', () => {
    const p = problemFromBody('<html>Traceback (most recent call last) at /var/www/secret.php</html>', 502);
    expect(JSON.stringify(p)).not.toContain('Traceback');
    expect(p.code).toBe('server_error');
  });
  it('toProblem handles arbitrary throwables', () => {
    expect(toProblem(new Error('boom')).code).toBe('network_error');
  });
});

describe('nav registry', () => {
  it('covers all 20 spec modules and marks unbuilt ones honestly', () => {
    const slugs = NAV.flatMap((g) => g.items.map((i) => i.slug));
    for (const s of ['dashboard', 'projects', 'websites', 'seo', 'keywords', 'content', 'google-ads', 'meta-ads', 'analytics', 'tracking', 'gtm', 'sgtm', 'ecommerce', 'competitors', 'strategy', 'reports', 'experiments', 'recommendations', 'integrations', 'settings', 'learning']) {
      expect(slugs).toContain(s);
    }
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(findNavItem('seo')).toMatchObject({ built: false, phase: 2 });
    expect(findNavItem('dashboard')?.built).toBe(true);
  });
});
