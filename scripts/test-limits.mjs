import test from "node:test";
import assert from "node:assert/strict";
import { clientIpFromHeaders, localRateLimit } from "../lib/utils/rateLimitCore.ts";

test("local limiter allows up to the limit, blocks the next request, and resets", () => {
  const key = `test:${Date.now()}:${Math.random()}`;
  assert.equal(localRateLimit(key, 2, 60_000, 1_000).allowed, true);
  assert.equal(localRateLimit(key, 2, 60_000, 1_001).allowed, true);
  const blocked = localRateLimit(key, 2, 60_000, 1_002);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.retryAfter > 0);
  assert.equal(localRateLimit(key, 2, 60_000, 61_001).allowed, true);
});

test("client IP prefers Cloudflare, then Netlify, then proxy headers", () => {
  const cf = new Headers({
    "cf-connecting-ip": "203.0.113.10",
    "x-nf-client-connection-ip": "198.51.100.10",
    "x-real-ip": "192.0.2.10",
  });
  assert.equal(clientIpFromHeaders(cf), "203.0.113.10");

  const netlify = new Headers({
    "x-nf-client-connection-ip": "198.51.100.10",
    "x-real-ip": "192.0.2.10",
  });
  assert.equal(clientIpFromHeaders(netlify), "198.51.100.10");

  const proxy = new Headers({ "x-forwarded-for": "192.0.2.20, 10.0.0.1" });
  assert.equal(clientIpFromHeaders(proxy), "192.0.2.20");

  assert.equal(clientIpFromHeaders(new Headers()), "unknown");
});
