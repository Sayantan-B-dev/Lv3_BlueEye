# Cloudflare Origin Traffic, Cache Misses and 503 Audit

**Date:** 2026-10-21
**Branch:** `investigate/cloudflare-cache-503`
**Status:** Code and diagnostics implemented; **not deployed**. No DNS, production environment variable, or Cloudflare rule was changed.
**Production build:** owner-run only. `npx tsc --noEmit` passes; `npm test` and `npm run test:redis` pass.

## 1. Summary

The baseline is **not** primarily a crawler problem. Origin traffic is high because Cloudflare does not cache extensionless HTML and because the origin's public HTML advertises `Cache-Control: public,max-age=0,must-revalidate` without `s-maxage`. Netlify's CDN caches some of that HTML, which is why Netlify `Age` values are high while Cloudflare reports `cf-cache-status: DYNAMIC`.

The 602 HTTP 503 responses are **not conclusively explained** by the available data. Current database and Redis health checks pass, and the old `blueeyeentertainment.netlify.app` site previously returned Netlify `{"error":"usage_exceeded"}` 503s. Correlating the current 503s requires Netlify function logs or Cloudflare request-level logs, neither of which was available. This report separates proven causes from hypotheses.

## 2. Measured baseline

Cloudflare (prior dashboard period):

- ~42.35K total requests, ~40.06K origin requests.
- **8.35% cache hit rate**, ~3.54K cached requests.
- p50 456 ms, p95 938 ms.
- 1.53% origin error rate; **602 HTTP 503**, 10 HTTP 500.
- ~37.02K requests classified Dynamic.
- Uncached paths: `/privacy-policy`, `/contact`, `/blog`, `/`, `/for-artists`, `/about`, `/login`, `/terms`, `/book-artist`.
- Singapore is the largest source country.
- Zero Cloudflare rate-limit actions.
- `htc` content type: likely `text/x-component` (Next.js RSC), not a separate file type. Treat as unproven until request logs confirm it.

Bounded production audit (`node scripts/audit-cloudflare.mjs`, 2026-10-21):

| Surface | Observed |
| --- | --- |
| Public HTML | 200, `Cache-Control: public,max-age=0,must-revalidate`, `cf-cache-status: DYNAMIC`, Netlify `Age` 2.8K–69K |
| `/login`, `/register`, `/profile`, `/reset-password`, `/switch-account` | 200/307, public `Cache-Control`, `cf-cache-status: DYNAMIC` |
| `/artists/page/2`, `/admin`, `/search`, scanner 404s | `private,no-cache,no-store,max-age=0,must-revalidate` |
| `/eye.webp`, `/favicon.ico`, `/icon-96.webp` | `public, max-age=14400, must-revalidate`, `REVALIDATED` |
| `/robots.txt` | `public, max-age=14400`, `EXPIRED` |
| `/sitemap.xml`, `/images-sitemap.xml` | `public,s-maxage=3600,stale-while-revalidate=86400`, `DYNAMIC` |
| `/og?title=Audit` | 200, ~66 KB, `public,max-age=31536000,immutable`, `DYNAMIC` |
| RSC request to `/` | 200, `Content-Type: text/x-component`, `DYNAMIC` |

The byte sizes show that even cached-looking pages still cost function time and Cloudflare origin fetches: `/` ~103 KB, `/artists` ~99 KB, `/artists/page/2` ~108 KB, `/category/singer/mumbai` ~114 KB, `/city/mumbai` ~190 KB, `/images-sitemap.xml` ~482 KB.

## 3. Root-cause analysis

### 3.1 Cloudflare is not caching HTML (confirmed)

Cloudflare's default cache behavior is extension/file based. Extensionless HTML is not cached without an explicit Cache Rule, even when the origin sends `s-maxage`. The current origin also sends `must-revalidate` with `max-age=0` to shared caches and no `s-maxage`, so even a cache that considers HTML is told not to reuse it.

This is why only images and Next static chunks produce cache hits. It also explains why Netlify's own CDN can show `Age` while Cloudflare shows `DYNAMIC`: the request is reused by Netlify only after Cloudflare forwards it.

### 3.2 Auth pages were incorrectly treated as public cache entries (confirmed)

`next.config.ts` previously included `/login`, `/register`, `/reset-password`, `/profile`, and `/switch-account` in `PUBLIC_PAGE_CACHE_SOURCES` and sent `Netlify-CDN-Cache-Control: public, s-maxage=3600`. The audit confirms those pages currently return public cache headers.

The pages are statically built today, so this may not have leaked session data yet, but it is an unsafe default. A future change that renders session-dependent content on those routes would leak it through a shared cache. These routes are now private and `no-store`.

### 3.3 RSC/prefetch variants are format-sensitive (confirmed)

A normal `/` request returns `text/html`; a request with `RSC: 1` and `Accept: text/x-component` returns `text/x-component` from the same URL. Next sends:

```text
Vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
```

Cloudflare's cache key does not safely separate arbitrary `Vary` values by default. A Cache Rule that caches `/` must bypass RSC, `next-router-prefetch`, `next-router-segment-prefetch`, `Accept: text/x-component`, and the `_rsc` query. Otherwise an RSC payload can be served to a browser, or an HTML document can be served to the router.

### 3.4 `public/` assets are not covered by the Next header rule (confirmed)

The Next config rule for `/(.*)\.(ico|png|jpg|jpeg|svg|webp|woff|woff2)` does not affect the headers observed for `/eye.webp` and icons; they were served with 4-hour Netlify defaults. `netlify.toml` now adds explicit image/font headers for `public/` assets.

### 3.5 `/og` is expensive and still origin-bound (confirmed cost, cause of 503 unproven)

`/og` takes ~1.3–3.6 s and was previously 206 requests / 32.51 MB / 206 function invocations. It now has 1-year shared-cache headers, but Cloudflare reports `DYNAMIC`, so every uncached request still invokes the function. The OG route also self-validates remote images with a 4 s timeout. This is a meaningful origin-cost source, but 206 OG requests cannot explain 602 503s by themselves.

### 3.6 Application-level rate limiting is active, but not at the edge (partially confirmed)

`npm run test:redis` passed against Upstash REST: `PING`, `SET`, `GET`, `INCR`, `EXPIRE NX`, and bounded `TTL`. `lib/utils/rateLimit.ts` uses distributed counters for write/auth routes and per-instance counters for high-volume public GETs. Cloudflare reported zero rate-limit actions, so no edge rate-limit rule was active in that period.

`clientIp()` previously preferred `x-nf-client-connection-ip`; behind Cloudflare that can be the Cloudflare edge address, which would bucket many users into one counter. It now prefers `cf-connecting-ip` first. Direct-to-Netlify requests can spoof that header, so the Netlify site should not be treated as an independent public origin; keep the custom domain behind Cloudflare.

### 3.7 503 hypotheses, in priority order

1. **Netlify account/capacity/usage response.** The strongest evidence is the earlier `usage_exceeded` 503 from the old Netlify URL. Check Netlify usage, bandwidth, function invocations, and deploy/function logs for the exact 503 timestamps. This is not fixable in application code.
2. **Function timeout or upstream stall.** Mongo previously had the default 30 s server-selection timeout; a slow Atlas connection can hold a function until the platform returns an error. `lib/db/connect.ts` now fails selection after 5 s, caps connect at 5 s, and resets a rejected connection promise so one failure does not poison the process until restart. This should convert long hangs into fast errors, not silently hide them.
3. **DB/Redis outage.** `/api/health/db` returned 200 and Redis REST passed. The fail-closed limiter only returns 503 on three write endpoints (`/api/contact`, `/api/inquiries`, `/api/artist-applications`); that cannot account for 602 mixed-origin 503s.
4. **Cold starts / concurrency.** Possible under a sharp burst, especially with slow `/og` and large RSC payloads. The data does not show concurrency or per-minute distribution, so this remains a hypothesis.
5. **DDoS.** Not established. The traffic is dominated by ordinary page paths and crawler/scanner activity. Do not claim DDoS protection is working until edge metrics show blocked/challenged traffic and origin 5xx falls.

### 3.8 Scanner traffic

`/.env`, `/.env.local`, `/wp-login.php`, `/xmlrpc.php`, `/dashboard`, and `/wrangler.toml` return 404, but each 404 is still a 28 KB Next response and can invoke a function. These paths should be blocked at Cloudflare, not handled in application code. Do not block the whole `.env` prefix in a way that breaks legitimate static assets; block exact scanner paths and WordPress probe prefixes.

## 4. Changes on this branch

- Added `lib/cache/publicRoutes.ts` as the single classification source:
  - Shared HTML: public informational, artists, city, category, blog, events.
  - Private: `/login`, `/register`, `/reset-password`, `/profile`, `/switch-account`, `/search`, `/admin*`, `/my-ticket*`, `/api*`.
  - Non-HTML shared: `robots.txt`, manifest, sitemap index/shards.
  - RSC/prefetch detection for tests and audit.
- `next.config.ts` now:
  - Sends `Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400` and the matching Netlify CDN header on public HTML.
  - Sends `private, no-store` plus `Netlify-CDN-Cache-Control: no-store` and `CDN-Cache-Control: no-store` on auth/admin/ticket/search pages.
  - Keeps admin, API, search and tokenized ticket pages out of shared caching.
- `netlify.toml` adds 7-day headers for `public/` images and 1-year immutable headers for fonts. This covers `/eye.webp`, icons and other public files that the Next header regex does not reach.
- `lib/db/connect.ts` caps Mongo selection/connect at 5 s and clears a rejected connection promise.
- `lib/utils/rateLimit.ts` prefers Cloudflare's client IP behind the proxy.
- `app/og/route.tsx` emits standard `s-maxage`/`CDN-Cache-Control` and `X-Robots-Tag: noindex`; the fallback stays at 5 minutes.
- `app/robots.ts` disallows `/register`, `/switch-account`, and `/my-ticket/`; Google/Bing and sitemaps remain allowed. `/og` is kept crawlable for social previews but sends `X-Robots-Tag: noindex`.
- Added `scripts/test-cache-policy.mjs`, `scripts/test-redis.mjs`, `scripts/audit-cloudflare.mjs`, and npm scripts.

## 5. Required Cloudflare configuration (manual, not applied)

The free plan currently allows 5 custom WAF rules, 10 Cache Rules, and one rate-limiting rule. Create rules in this order.

### 5.1 Cache Rule: bypass RSC and prefetch (create first)

Expression:

```text
(http.request.headers["rsc"][0] eq "1") or
(http.request.headers["next-router-state-tree"][0] ne "") or
(http.request.headers["next-router-prefetch"][0] eq "1") or
(http.request.headers["next-router-segment-prefetch"][0] eq "1") or
(http.request.headers["accept"][0] contains "text/x-component") or
(http.request.uri.query contains "_rsc=")
```

Action: **Bypass cache**.

### 5.2 Cache Rule: bypass authenticated/admin/API/ticket/search requests

Expression:

```text
(http.request.uri.path contains "/admin") or
(http.request.uri.path contains "/api/") or
(http.request.uri.path contains "/search") or
(http.request.uri.path contains "/my-ticket") or
(http.request.uri.path in {"/login" "/register" "/reset-password" "/profile" "/switch-account"}) or
(http.cookie contains "next-auth") or
(http.cookie contains "__Secure-next-auth") or
(http.cookie contains "session-token")
```

Action: **Bypass cache**.

### 5.3 Cache Rule: cache public HTML

Expression:

```text
(http.request.method eq "GET") and (
  (http.request.uri.path in {"/" "/about" "/contact" "/for-artists" "/privacy-policy" "/terms" "/book-artist" "/categories" "/artists" "/blog" "/events"}) or
  starts_with(http.request.uri.path, "/artists/") or
  starts_with(http.request.uri.path, "/city/") or
  starts_with(http.request.uri.path, "/category/") or
  starts_with(http.request.uri.path, "/blog/") or
  starts_with(http.request.uri.path, "/events/")
)
```

Action: **Eligible for cache**.

Settings:

- Edge TTL: **override origin to 1 hour** so caching does not depend on Next's per-route header surviving the Netlify runtime.
- Browser TTL: respect origin (`max-age=0` keeps revalidation for browsers).
- Do not set "Ignore query string". Query strings can change filters; use the standard query-inclusive key.
- Do not cache `/og` with this rule; give it its own rule.

### 5.4 Cache Rule: `/og`

Expression:

```text
(http.request.uri.path eq "/og")
```

Action: **Eligible for cache**; Edge TTL: override origin to 1 year. Keep the query string in the cache key because `title`, `description`, `type`, `category`, and `image` change the image.

### 5.5 Cache Rule: sitemaps, robots and manifest

Expression:

```text
(http.request.uri.path in {"/sitemap.xml" "/images-sitemap.xml" "/robots.txt" "/site.webmanifest"}) or
starts_with(http.request.uri.path, "/sitemaps/")
```

Action: **Eligible for cache**; Edge TTL: override origin to 1 hour. The image
sitemap is ~482 KB, so caching it avoids repeated origin/function work.

### 5.6 WAF custom rule: high-volume SEO/scanner user agents

Expression:

```text
(http.user_agent contains "AhrefsBot") or
(http.user_agent contains "SemrushBot") or
(http.user_agent contains "MJ12bot") or
(http.user_agent contains "l9scan") or
(http.user_agent contains "CT-WP-Scanner")
```

Action: **Block**. Do not include Googlebot, Bingbot, DuckDuckBot, or a generic "bot" match.

### 5.7 WAF custom rule: scanner paths

Expression:

```text
(http.request.uri.path eq "/.env") or
(http.request.uri.path eq "/.env.local") or
(http.request.uri.path contains "/wp-") or
(http.request.uri.path eq "/xmlrpc.php") or
(http.request.uri.path contains "/.git") or
(http.request.uri.path eq "/wrangler.toml")
```

Action: **Block**.

### 5.8 Rate limiting rule: API writes

Expression:

```text
starts_with(http.request.uri.path, "/api/") and
not (http.request.uri.path eq "/api/ticketing/webhook/razorpay")
```

Action: **Block**, 60 requests per 10 seconds per IP, 10-second block. Keep the Razorpay webhook excluded. This is a safety net; application limits remain active and the threshold should be adjusted if admin API usage is affected.

### 5.9 Cache purge and verification

After deploying the branch:

1. Purge Cloudflare cache for `blueeyeentertainment.in` (or at least `/`, `/login`, `/profile`, `/register`, `/reset-password`, `/switch-account`, `/og`).
2. Run `AUDIT_BASE_URL=https://blueeyeentertainment.in node scripts/audit-cloudflare.mjs`.
3. Run it a second time after 60 seconds and confirm repeat public pages show `HIT` (or `REVALIDATED`) and a non-zero `Age`.
4. Confirm `/login`, `/profile`, `/search?q=test`, and `/admin` do **not** show a shared cache hit.
5. Confirm `/sitemap.xml`, `/images-sitemap.xml`, and `/robots.txt` are cached and do not invoke a function on repeat requests.
6. Confirm `/` with `RSC: 1` is not served an HTML cache entry.
7. Purge the cache again if a bad HTML variant was observed.

Do not enable "Ignore query string" for HTML or `/og`; filtered listings and OG parameters use the query string. If Cache Key rules are available, exclude only tracking parameters (`utm_*`, `fbclid`, `gclid`); never strip `q`, `category`, `city`, or the OG parameters. Ensure the rule does not cache 5xx responses.

## 6. Verification commands

```bash
npx tsc --noEmit
npm test
npm run test:redis
node scripts/audit-cloudflare.mjs
node scripts/audit-cloudflare.mjs --strict
```

`--strict` is intended for the post-deploy check. Before deployment it is expected to report the pre-existing public HTML, auth-page, RSC, and Cloudflare cache warnings.

Scoped ESLint on the changed/new files reports 0 errors and one pre-existing `@next/next/no-img-element` warning in `app/og/route.tsx`. The repository-wide `npm run lint` still reports the pre-existing backlog (370 errors / 74 warnings); no new error is in the files changed by this branch.

## 7. Rollback

- Code: `git revert <commit>` on `investigate/cloudflare-cache-503`, then redeploy the previous Netlify build. No schema or data migration is involved.
- Netlify: deploy the previous successful build; the `netlify.toml` image/font header rules disappear with that build.
- Cloudflare: disable or delete the new Cache Rules in reverse order, or set the cache rule to **Bypass**. Purge the zone cache after rollback so stale public HTML is removed.
- Mongo: the 5 s timeouts and promise reset are safe to revert independently; they do not change persisted data.
- Do not change DNS or Netlify environment variables as part of this rollback.

## 8. Metrics to collect after deploy

- Cloudflare: total requests, origin requests, cache hit ratio, cached requests, p50/p95, 5xx count/rate, 503 count, top paths/countries/content types.
- Netlify: function invocations, bandwidth, 5xx/503 by function, duration, and deploy/usage status.
- Compare at least 1 hour and 24 hours after deploy. The branch improves cacheability but does **not** prove a DDoS or cost reduction until these numbers move.
- Target order: remove avoidable auth-page caching, get public HTML hit ratio above the 8.35% baseline, reduce `/og` invocations, then reassess 503s.

## 9. Unverified items

- 503 root cause and per-path/timestamp correlation.
- Whether Netlify preserves `cf-connecting-ip` and whether `clientIp()` receives real client IPs through Cloudflare in production.
- Whether Cloudflare's free plan Cache Rules support every expression/key setting above in the current dashboard.
- Whether `netlify.toml` header rules win over Next's public-file headers on Netlify; verify with `curl -I` after deploy.
- Whether the 503 count includes old-site migration traffic or Netlify account usage.
- `htc` classification; likely RSC `text/x-component`, not proven.
- Whether `next.config.ts` `Cache-Control` overrides Next's per-route HTML headers after a production build. The audit must confirm this; if not, move the shared header to Netlify/Cloudflare only.
- Turnstile widget hostname verification and production challenge behavior.
