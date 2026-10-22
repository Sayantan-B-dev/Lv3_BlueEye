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
import { clientIpFromHeaders, localRateLimit } from "./rateLimitCore";

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
 * Per-instance limiter for high-volume public GETs.
 *
 * These routes are hit constantly by crawlers and browsers; spending Upstash
 * commands on every request would exhaust the free tier faster than it saves
 * compute. Shared, distributed limits for these paths belong at the edge.
 */
export function rateLimitLocal(
  key: string,
  limit = 60,
  windowSeconds = 60
): RateLimitResult {
  const local = localRateLimit(key, limit, windowSeconds * 1000);
  return { ...local, degraded: false, unavailable: false };
}

/**
 * Behind Cloudflare, Netlify sees the Cloudflare edge as the connection peer.
 * Prefer Cloudflare's client IP so shared limits do not bucket every visitor
 * behind the same edge address. Netlify headers remain the fallback.
 */
export function clientIp(request: Request): string {
  return clientIpFromHeaders(request.headers);
}
