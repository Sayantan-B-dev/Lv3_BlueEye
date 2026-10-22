# TODO — BlueEye abuse / cost containment

**Updated:** 2026-10-22
**Branch:** `perf/netlify-function-reduction`
**Status:** favorites gating, private API headers, static legal/booking pages, robots policy, lint cleanup, tests, and owner build are complete. Staging/deploy verification remains pending.
**Archives:** Completed work: `todo_done.md` · Manual/owner work: `todo_mannual.md`
**Audit:** `docs/CLOUDFLARE_CACHE_503_AUDIT.md` · `report.md`

Reference telemetry: **8.35% Cloudflare cache hit rate**; `/api/users/favorites` 1.4K requests / ~1.1K errors; `/api/auth/session` 1.4K / 99.6% invocations; `/artists` 1.4K / 96.4% invocations; `/privacy-policy` 4.7K / 1K; `/` 3.7K / 1.4K; `/book-artist` 2.4K / 1.6K.

## Current findings

- `FavoritesProvider` fetches `/api/users/favorites` unconditionally on mount (`components/providers/FavoritesProvider.tsx:44-83`). The API checks auth before DB work (`app/api/users/favorites/route.ts:13-15`), so the ~1.1K errors are most likely anonymous 401s.
- There is one `SessionProvider` (`components/auth/AuthProvider.tsx:6`) with no polling and no window-focus refetch. `Navbar` still calls `useSession()` globally, so public pages perform one initial session hydration request. Multiple subscribers share that request.
- `/artists` is already ISR (`app/artists/page.tsx:7`, `revalidate = 3600`). Its 96.4% invocation rate points to Netlify handler/Cloudflare cache misses, not dynamic rendering.
- `/api/artists` GET already has a 60-second public cache, but its limiter is per-instance (`lib/utils/rateLimit.ts:86-98`). Cloudflare must be the global edge limiter.
- Sitemap already uses an index and shards; category–city threshold is 3. At 275 invocations it is not the first cost problem.
- `app/robots.ts` matches the recommended policy except it still allows `"/_next/image"`.

## Progress at a glance

| Area | Status |
| --- | --- |
| Favorites 401s | Client gating done; build passes; staging/browser verification pending |
| Session traffic | Cleanup done; measurement pending; lazy auth optional |
| `/artists` invocation cost | ISR confirmed; edge cache verification pending |
| Public page/API caching | Route headers done; edge rules and HIT verification pending |
| Cloudflare rate limits | Blocked on manual edge configuration |
| Sitemap | Caching done; curation pending |
| Rendering/database work | `/book-artist` + `/privacy-policy` converted; review continues |
| Robots policy | Done |
| Lint/type/build | Touched files clean; `tsc`, tests, owner build pass |
| Production metrics | Blocked on owner deploy/log access |

## Ground rules

- No production deploy, live DNS change, or production env edit without explicit approval.
- No synthetic load testing, DDoS simulation, or crawler spoofing.
- No geo-blocking, Chrome-UA blocking, or blanket `noindex`.
- Never log or commit `UPSTASH_REDIS_REST_TOKEN`, Turnstile secrets, or other credentials.
- The owner runs `npm run build`; use `npx tsc --noEmit`, lint, unit tests, and staging smoke tests for verification.
- Do not claim production savings until approved deployment metrics confirm them.

## P0 — Stop expensive API traffic

### P0-1. Stop anonymous favorites requests

Code complete; only verification remains.

- [ ] Obtain the status-code breakdown for `/api/users/favorites` (401 vs 403 vs 5xx) from staging or production logs.
- [ ] Add a regression test asserting the server checks auth before any DB, Redis, or Mongo access.
- [ ] Browser-test logged-out and logged-in page loads, favorite toggle, and 401 redirect behavior.

**Acceptance:** logged-out page load makes zero `/api/users/favorites` requests; authenticated user makes one GET; favorites 401 volume drops by more than 90%; private responses are never publicly cached.

### P0-2. Session request audit and cleanup

Session audit and duplicate-fetch cleanup are done; measurement only.

- [ ] Measure `/api/auth/session` requests per page before considering lazy Navbar/account hydration.
- [ ] Only if session traffic remains material, implement lazy account UI as a separate change with an auth-hint tradeoff.

**Acceptance:** at most one session hydration request per page; no background session polling; no duplicate session subscribers causing extra requests.

### P0-3. Verify and cache `/artists` correctly

- [ ] Verify `/artists` ISR output and response headers on staging; do not convert it to dynamic rendering.
- [ ] Add a Cloudflare cache rule for `/artists*` and `/api/artists*` with a 5–15 minute edge TTL.
- [ ] Bypass RSC/prefetch requests (`RSC`, `Next-Router-Prefetch`, `text/x-component`) from shared HTML cache rules.
- [ ] Confirm repeated `/artists` requests produce Cloudflare HITs and no new Netlify invocation.
- [ ] Review `getDistinctCategories`, `getDistinctCities`, and `getArtists` for duplicate calls, narrow projections, and indexes.

**Acceptance:** repeated listing requests are edge HITs; `/api/artists` repeated GETs are HITs; database query count per revalidation does not increase.

### P0-4. Cache public pages and read-only APIs

Private route headers are complete; public/edge verification remains.

- [ ] Audit `Cache-Control`, `CDN-Cache-Control`, and `Netlify-CDN-Cache-Control` on public artist/category/city listing pages, `/api/artists`, `/api/search`, and sitemap routes.
- [ ] Use 5–15 minute shared TTLs for listing pages/APIs and 1 hour for legal/static pages; keep stale-while-revalidate.
- [ ] Ensure no public caching of session, favorites, profile, auth, tickets, admin, writes, or responses with `Set-Cookie`.
- [ ] Verify `cf-cache-status` and function invocation counts on staging.
- [ ] Do not shorten ISR solely to match edge TTL; tune edge TTL independently.

**Acceptance:** repeated public requests are edge HITs; private routes remain MISS/BYPASS; Netlify function invocations fall without personalized content becoming shared.

### P0-5. Cloudflare edge rate limits

- [ ] Write the exact edge rule specification: `/api/search` 30/min/IP; `/api/artists` 60/min/IP; auth/login 10/min plus a tighter hourly cap; write endpoints 10/min; burst protection.
- [ ] Keep application-level 429 responses with `Retry-After`.
- [ ] Keep the local limiter as the public-GET fallback; use shared Redis limits for auth/write endpoints where configured.
- [ ] Test staging 429 behavior, retry headers, and false-positive risk before production.
- [ ] Do not block Googlebot/Bingbot or all crawler traffic; do not block by country alone.

**Acceptance:** abusive bursts are rejected at the edge; normal visits and legitimate crawlers pass; origin 429s decrease.

## P1 — Caching, rendering, and SEO

### P1-1. Curate the sitemap without rebuilding it

- [ ] Keep the existing index plus shards and caching.
- [ ] Keep canonical, public, indexable URLs: published artist profiles, useful category/city pages, published events, and blog posts.
- [ ] Review category–city count distribution and SEO impact before changing the threshold from 3 to 5; keep 3 unless pages below 5 are genuinely thin.
- [ ] Remove thin or duplicate URLs only with SEO justification.
- [ ] Exclude login, account, API, search-filter, and other non-indexable URLs.
- [ ] Add/verify CDN headers on the index, image sitemap, and shards; test HITs.
- [ ] Keep artist sharding if URL volume warrants it.

**Acceptance:** no sitemap architecture rewrite; low-value URLs are removed only with SEO justification; sitemap invocations do not increase.

### P1-2. Reduce repeated rendering and database work

- [ ] Inventory routes that still invoke a function on every request.
- [ ] Start with `/artists`, then `/book-artist` and public category/city routes.
- [ ] Remove repeated Mongo counts, aggregations, and lookups; use narrow projections, pagination, and indexes.
- [ ] Eliminate remaining duplicate data fetching between layout, page, and components.
- [ ] Verify static/ISR status for `/book-artist`, `/contact`, `/privacy-policy`, `/about`, and `/for-artists` from the owner build output.

**Acceptance:** repeated DB queries per render are reduced; no per-visitor data appears on public pages; UX and SEO remain intact.

### P1-3. Bot and abuse handling

- [ ] Export or inspect request logs by path, user agent, status, country, and cache status.
- [ ] Keep Googlebot/Bingbot access to valuable SEO pages.
- [ ] Use Cloudflare managed rules, bot protections, scanner-path blocks, and edge rate limits.
- [ ] Challenge or block suspicious automated traffic based on request patterns, not country or UA alone.
- [ ] Block obvious probes for `/.env.local`, `/wrangler.toml`, and other nonexistent admin/config paths that are not app routes.
- [ ] Do not block by country or browser UA alone; do not treat request count as proof of abuse.
- [ ] Verify the intentional AI-crawler policy separately from security blocking; remember robots.txt does not stop malicious clients.

**Acceptance:** suspicious probes are blocked; Singapore traffic is not blanket-blocked; canonical pages remain crawlable.

## Engineering follow-ups

- [ ] Add unit coverage for Redis limiter atomicity, expiry, multi-instance behavior, and Redis-outage fallback.
- [ ] Verify the Redis module remains server-only after the owner’s next build.
- [ ] Re-check CSP after any new third-party origin is introduced.
- [ ] Add `generateStaticParams` for the highest-value paginated routes only if telemetry justifies it.
- [ ] Redirect legacy `?page=` / `?category=` / `?status=` URLs to the canonical static paths, or document the tradeoff.
- [ ] Wire Turnstile verification into contact, inquiry, application, register, and login after site/secret keys are available.
- [ ] Verify deployed `/og` output after the next owner build.

## Deferred / not planned

- Replacing Redis or adding another database.
- Building custom AI-bot detection.
- Rewriting the sitemap architecture.
- Blocking all crawlers or all AI agents.
- Optimizing small static assets before repeated server-side execution.
- Blanket rate limits on every public page.
- Synthetic load testing; use approved production/staging telemetry instead.

## Reporting constraints

- Function-invocation reduction is not claimed until deployment metrics confirm it.
- Report before/after request count, invocation count/ratio, cache status, p50/p95, error rate, and observable Mongo queries for each changed route.

## Do not

- Do not block Singapore, Chrome UAs, all bots, or all AI agents.
- Do not add `noindex` or `Disallow: /` to save credits.
- Do not cache authenticated or personalized responses publicly.
- Do not add a paid service beyond what is already in use without approval.
- Do not treat a passing build as proof of traffic reduction.
