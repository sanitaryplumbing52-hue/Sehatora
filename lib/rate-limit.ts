/**
 * Fixed-window rate limiter, in-memory.
 *
 * Good enough for a single Node process / demo deployment. For a
 * multi-instance production deployment, swap the `Map` below for a Redis
 * (e.g. Upstash) backed store behind the same `checkRateLimit` signature —
 * no call site changes required.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (bucket.count >= limit) {
    return { success: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { success: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}

export function rateLimitKeyFromRequest(req: Request, scope: string): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}
