/**
 * Shared rate limiting.
 *
 * Uses Upstash Redis counters (INCR + EXPIRE NX) so limits hold across
 * separate serverless instances. Falls back to a per-instance in-memory
 * bucket when Redis is not configured or temporarily unavailable.
 *
 * Policy per route:
 *  - fail-open:  reads and auth. On Redis failure the local bucket still
 *                applies, so the route does not become unlimited.
 *  - fail-closed: costly writes (inquiries, contact, applications). On Redis
 *                failure the route returns 503 instead of accepting writes.
 */
import { isRedisConfigured, redisIncr } from "@/lib/db/redis";

export type RateLimitPolicy = "fail-open" | "fail-closed";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
  /** True when Redis was configured but the counter could not be updated. */
  degraded: boolean;
  /** True when a fail-closed route must refuse the request (503). */
  unavailable: boolean;
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_LOCAL_KEYS = 10_000;

function localRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  if (buckets.size > MAX_LOCAL_KEYS) buckets.clear();

  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfter: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  const retryAfter = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfter,
  };
}

export async function rateLimit(
  key: string,
  limit = 60,
  windowSeconds = 60,
  policy: RateLimitPolicy = "fail-open"
): Promise<RateLimitResult> {
  const windowMs = windowSeconds * 1000;

  if (isRedisConfigured) {
    const counter = await redisIncr(key, windowSeconds);
    if (counter) {
      return {
        allowed: counter.count <= limit,
        remaining: Math.max(0, limit - counter.count),
        retryAfter: counter.ttlSeconds,
        degraded: false,
        unavailable: false,
      };
    }

    if (policy === "fail-closed") {
      // Do not let a Redis outage turn costly write endpoints into free spam relays.
      return {
        allowed: false,
        remaining: 0,
        retryAfter: 30,
        degraded: true,
        unavailable: true,
      };
    }
  }

  const local = localRateLimit(key, limit, windowMs);
  return { ...local, degraded: true, unavailable: false };
}

/**
 * Netlify provides x-nf-client-connection-ip from its edge and overwrites
 * client-supplied values. Only fall back to forwarded headers when absent.
 */
export function clientIp(request: Request): string {
  const netlifyIp = request.headers.get("x-nf-client-connection-ip")?.trim();
  if (netlifyIp) return netlifyIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "unknown";
}
