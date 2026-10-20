# BlueEye — Abuse, Caching & Cost Report

**Repository:** [Sayantan-B-dev/Lv3_BlueEye](https://github.com/Sayantan-B-dev/Lv3_BlueEye)
**Stack:** Next.js 16.2.4 (App Router) · Netlify · MongoDB/Mongoose · NextAuth · Upstash Redis · ImageKit
**Date:** 2026-10-21
**Status:** audit complete — **no application code changed, nothing deployed**
**Companion file:** [`todo.md`](./todo.md) (prioritized execution plan)

---

## 1. Executive summary

The site is not being "DDoS'd" in the volumetric sense. It is being **repeatedly rendered**:

- **92,686 requests / 428.9 MB** in the measured period.
- **79.1K (85%) of those requests are RSC payloads** (`text/x-component`) — 208.27 MB, 47.7K function invocations.
- **Every city and category page invokes a function on ~100% of requests** (e.g. `/city/kolkata`: 2,500 requests → 2,500 invocations). `revalidate` is declared, but the pages read `searchParams`, which forces dynamic rendering. The cache never engages.
- **`/sitemap.xml` alone accounts for 76.24 MB** across 1.1K requests (~69 KB/response) because it enumerates up to 5,000 artists plus every category × city combination.
- **Redis is silently disabled** after the env rename: the code still reads `REDIS_URL`, while `.env.example` now defines `UPSTASH_REDIS_*` — so all caching and any future shared rate limiting no-op.

The largest cost driver is therefore **the application re-doing work it should never repeat**, not a missing shield. The shield (edge/WAF) is still required for a real flood, but it would mask the problem rather than fix it: even legitimate bots and prefetching browsers are triggering tens of thousands of function invocations.

**Priority:** disable redundant RSC prefetches → make listing pages truly static → shrink and cache the sitemap → restore Redis → add shared rate limits → put Cloudflare in front.

---

## 2. What the telemetry actually says

### 2.1 By content type

| Type | Requests | Bandwidth | Function invocations |
| --- | --- | --- | --- |
| RSC data (`text/x-component`) | **79.1K** | **208.27 MB** | **47.7K (60.2%)** |
| XML (sitemap) | 1.2K | **76.44 MB** | 411 (35.6%) |
| HTML | 5K | 72.04 MB | 3.3K (66.2%) |
| JavaScript | 1.9K | 28.77 MB | — |
| Images (webp) | 679 | 22.84 MB | — |
| Fonts (woff2) | 294 | 8.85 MB | — |

RSC + XML together are **~285 MB of 428.9 MB (66%)** and ~48K of ~79K function invocations. Fix those two and the bill collapses.

### 2.2 By URL

| URL | Requests | Bandwidth | Function invocations |
| --- | --- | --- | --- |
| `/sitemap.xml` | 1.1K | 76.24 MB | 408 (35.5%) |
| `/` | 4.3K | 34.28 MB | 1K (24.4%) |
| `/book-artist` | 5.2K | 21.2 MB | 930 (17.7%) |
| `/eye.webp` | 90 | 17.13 MB | — |
| `/login` | 6.6K | 16.05 MB | 820 (12.4%) |
| `/contact` | 5.2K | 15.46 MB | 1.3K (25.2%) |
| `/about` | 5K | 14.63 MB | 1.1K (22.2%) |
| `/for-artists` | 4.9K | 13.31 MB | 1.2K (24.8%) |
| `/privacy-policy` | 5.2K | 12.33 MB | 1.5K (28.7%) |
| `/category/dj` | 2.4K | 6.26 MB | 2.4K (**99.8%**) |
| `/city/{kolkata,chennai,delhi,mumbai,dubai,bengaluru}` | ~2.4–2.5K each | ~5.8–6.2 MB each | **99.9–100%** |
| `/category/{tv,singer,rapper,bollywood,comedian}` | ~2.3–2.5K each | ~5.7–5.9 MB each | **99.6–99.9%** |
| `/blog`, `/events`, `/artists` | ~2.4K each | ~5.3–5.9 MB each | 99.1–100% |

Six cities + five categories alone are **~27K requests and ~27K function invocations**.

### 2.3 By user agent (selected)

| Agent | Requests | Bandwidth | Function invocations |
| --- | --- | --- | --- |
| Chrome 103–133 on Windows (16 versions, 3.0K–9.5K each) | **~78K** | — | ~55–61% each |
| `facebookexternalhit/1.1` (page preview) | 323 | 12.07 MB | 3 (0.9%) |
| `AhrefsBot/7.0` | 917 | 8.7 MB | 910 (**99.2%**), 43% errors |
| `Amzn-SearchBot` | 720 | 11.04 MB | 690 (95.8%) |
| `MJ12bot` | 193 | 2.01 MB | 192 (99.5%) |
| `SemrushBot` | 218 | 2.89 MB | 127 (58.3%) |
| `Baiduspider` | 244 | 3.1 MB | 129 (52.9%) |
| Googlebot | 114 | 1.08 MB | 104 (91.2%) |

The mass of **old Chrome versions on Windows** (103–133, 16 versions, evenly distributed) accounts for roughly **84% of all requests** and is a textbook fake-UA bot signature: real Chrome auto-updates within weeks and real users are not spread evenly across 30 stale versions. These are almost certainly scrapers. But do **not** block Chrome UAs — that would hit real visitors. Handle them via edge bot scoring, not UA allow/deny lists.

This also reframes the incident: most of the 92.7K requests are not "visitors plus a DDoS" — they are automation that the site happily renders server-side, 24 cards and 24 prefetches at a time.

### 2.4 The mystery "429" line

`Next.js Middleware 429` (429 requests, 2.26 MB) appears as a user-agent bucket, not a response code. `proxy.ts` never returns 429 — it only redirects non-slug city/category paths. This is Netlify attributing internal Next.js middleware invocations; it is **not** evidence that rate limiting is working. There is currently no shared rate limiter on any public route.

---

## 3. Root causes (audited, with code evidence)

### R1. RSC prefetch flood — largest cost, smallest fix

`components/ui/ArtistCard.tsx` renders a plain `<Link href={/artists/${slug}}>` with no `prefetch` prop. Every `/artists`, `/city/*` and `/category/*` page renders **24 cards**, so a single page view triggers up to 24 RSC prefetches. `Navbar.tsx` and the footer add more. Next.js prefetches static/ISR routes as soon as links enter the viewport.

Result: **79.1K RSC requests, 47.7K function invocations, 208 MB**.

Fix: `prefetch={false}` on card and list links; keep default prefetch only on primary navigation. Navigation still works (fetch on click), and the hover prefetch behaviour of dynamic routes is unchanged.

### R2. Listing pages are dynamic despite `revalidate`

`app/city/[city]/page.tsx`, `app/category/[category]/page.tsx`, `app/artists/page.tsx` all destructure `searchParams`:

```ts
export default async function CityArtistsPage({ params, searchParams }) { … }
export const revalidate = 3600;
```

In the App Router, reading `searchParams` opts the route into dynamic rendering. `generateStaticParams()` + `revalidate` cannot produce request-time cache hits. Hence the 99.8–100% invocation rates, and hence UTM-tagged URLs (`/city/ahmedabad?utm_source=chatgpt.com`, 411 requests) each produce a fresh render.

Fix: static canonical page without `searchParams` (page 1), static paginated routes (`/city/[city]/page/[page]`), client-side filters calling a capped `/api/artists`. Alternatively strip tracking params in `proxy.ts` and verify CDN caching — but that alone does not remove the dynamic render.

### R3. Sitemap is oversized and under-cached

`app/sitemap.ts`:

- `getArtistsForSitemap(max = 5000)` — up to **5,000** artist URLs, each with `lastModified`.
- All categories, all cities, plus `getCategoryCityCounts(3)` category × city combos.
- Only `revalidate = 3600`; no explicit `s-maxage`.

1.1K requests × ~69 KB ≈ 76 MB. Telemetry shows only 35.5% invoke functions, so ISR partially works — but 408 invocations of a page that changes hourly is waste, and the payload is enormous for bots to re-download.

`app/images-sitemap.xml/route.ts` is worse in kind: a plain `GET` handler with **no revalidate and no cache headers**, querying Mongo and emitting up to 500 artists × 5 images per request.

Fix: sitemap index + ~1,000-URL shards, canonical URLs only, explicit CDN cache headers, and a cached images sitemap.

### R4. Redis is disconnected from its configuration

`lib/db/redis.ts`:

```ts
const redisUrl = process.env.REDIS_URL;
export const redis = global.__redis ?? (redisUrl ? new Redis(redisUrl, …) : null);
```

`.env.example` now has `REDIS_URL` commented out and `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` active. `@upstash/redis` is not installed. Therefore `redis` is `null`, `getCache()` always misses, `setCache()` always returns `false`, and **any rate limiting built on this client would silently allow everything**.

This must be fixed first, before rate limiting is meaningful.

### R5. Rate limiting is per-process and barely applied

`lib/utils/rateLimit.ts` is an in-memory `Map` — it resets per serverless instance and cannot coordinate across Netlify functions. It is used only by ticket verification/check-in routes. `/api/search`, `/api/artists`, `/api/filters`, `/api/contact`, `/api/inquiries`, `/api/artist-applications`, login/register/reset have **no request-rate limit**. Contact and inquiries rely on a 30-minute **per-user submission cooldown** stored in Mongo — not a rate limiter, and it does not protect anonymous or unauthenticated abuse.

`clientIp()` trusts `x-forwarded-for[0]` — spoofable unless the proxy guarantees it. Netlify provides `x-nf-client-connection-ip`.

### R6. Every page load asks who you are

`components/auth/AuthProvider.tsx` renders `<SessionProvider>` with no session prop, while `FavoritesProvider` and `ArtistCard` both call `useSession()`. Anonymous visitors still trigger `/api/auth/session` per page load; logged-in users add `/api/users/favorites`. This is invisible in the top-URL table (it is under `/api/`) but adds function work to every page.

### R7. No edge layer

Netlify is the origin. A real L7 flood — or simply Ahrefs/Semrush/MJ12 hammering 5,000 sitemap URLs — consumes function invocations and bandwidth regardless of application code. Application fixes reduce cost per request; they do not absorb a flood.

---

## 4. Revised strategy (priority order)

| # | Action | Expected effect | Effort |
| --- | --- | --- | --- |
| 1 | `prefetch={false}` on card/list links | Removes most of 79.1K RSC requests / 47.7K invocations | Low |
| 2 | Static canonical listing pages + static pagination | Removes ~27K function invocations from city/category | Medium |
| 3 | Sitemap index + shards + long CDN cache | 76 MB → cached; 408 invocations → ~0 | Medium |
| 4 | Upstash REST client repair | Restores cache and enables shared limits | Low–medium |
| 5 | Shared atomic rate limits on APIs/auth/writes | Caps abuse cost; 429s instead of DB work | Medium |
| 6 | Session provider cleanup | Removes per-page `/api/auth/session` | Low |
| 7 | Cloudflare edge + WAF + bot mode | Absorbs actual flood; blocks fake-Chrome bots | Manual (DNS approval) |
| 8 | Monitor and tune | Proves the reduction | Ongoing |

**Expected outcome (estimate, to be verified after deploy):** function invocations fall from ~79K to the low tens of thousands or less in an equivalent window, and bandwidth falls by roughly half. These are projections, not results.

---

## 5. Redis / Upstash audit and policy

**Current state:** code = `ioredis` + `REDIS_URL`; environment = Upstash REST URL + token; dependency `@upstash/redis` absent. Nothing works. Do not assume the env change took effect just because variables exist.

**Target state:** one server-only REST client (`lib/db/redis.ts`), no new dependency (native `fetch`), 1–1.5 s timeout, sanitized errors, `isRedisConfigured` + `redisHealth()` exports, never imported into a client component.

**Fail policy (explicit, per route):**

| Route class | Policy on Redis failure | Rationale |
| --- | --- | --- |
| Public GET (`/api/search`, `/api/artists`, `/api/filters`) | fail-open + in-process fallback | Availability matters more than throttling reads; DB cost still bounded by caching/validation |
| Auth (login, register, reset) | fail-open + strict per-instance fallback | Do not lock users out during a Redis blip, but do not become unlimited either |
| Writes (`inquiries`, `contact`, artist applications) | **fail-closed** → `503` + `Retry-After` | A Redis outage must not turn booking/email endpoints into free spam relays |

**Atomicity:** use `INCR` followed by `EXPIRE key <window> NX` in one pipeline (Upstash supports Redis 7 semantics). No `GET`-then-`SET` counters.

**Secrets:** `UPSTASH_REDIS_REST_TOKEN` must never be logged, committed, returned by an endpoint, or bundled client-side. `.env.example` keeps placeholders only.

---

## 6. Caching policy

| Route | Policy | Notes |
| --- | --- | --- |
| `/`, `/artists`, `/artists/[slug]`, `/city/[city]`, `/category/[category]`, `/blog`, `/events` | Static/ISR, CDN-cached | Must not read `searchParams` in the page body |
| Pagination/filter variants | Separate static routes or client-side fetch | Avoid unbounded query-string cache keys |
| `/sitemap.xml`, `/sitemaps/*`, `/images-sitemap.xml` | `s-maxage=3600, stale-while-revalidate=86400` | Must stay public |
| `/api/home-data`, `/api/filters` | `s-maxage=300–600` | Public data only |
| `/api/search`, `/api/artists` | `s-maxage=60` (validated params only) | Never cache personalized responses |
| `/api/auth/*`, `/login`, `/profile`, `/admin/*`, `/api/users/*` | `private, no-store` | Never public |
| `/_next/static/*` | Immutable, one year | Already configured in `next.config.ts` |

**Do not** cache POST responses, authenticated pages, or arbitrary query strings.

**SEO guardrails:** keep canonicals, sitemap entries, `robots.txt`, metadata and JSON-LD intact; never use `noindex` as a cost-control measure; verify Googlebot/Bingbot, not UA strings.

---

## 7. Edge protection (DDoS reality)

Application changes cannot stop a flood. Netlify meters requests and invocations whether the code is efficient or not. To keep the site up and credits intact under attack, put Cloudflare in front:

1. Add the domain to Cloudflare, import DNS, proxy records (orange cloud).
2. SSL/TLS mode **Full (strict)**; origin remains Netlify.
3. Enable **Bot Fight Mode** (free) — test login, Razorpay webhooks and API clients afterwards.
4. Cache rules for `/_next/static/*` (cache everything) and public pages (short TTL, respect origin).
5. One edge rate-limit rule for `/api/*` (e.g. 60 req/min/IP) as a second layer.
6. Keep verified Googlebot/Bingbot allowed. Do not block by country or UA.

**Manual approval required:** DNS/nameserver changes, production env changes, enabling WAF rules. None of this has been done. If DNS cannot change, Netlify's path-based rate limiting is the interim substitute.

---

## 8. Cost math and quotas

Known telemetry: 92,686 requests, 428.9 MB, ~79K function invocations. Netlify's free tier includes 100 GB bandwidth and 125K function invocations per month (verify against the plan shown in the account). The current shape is one bad crawl window away from exhaustion:

- Sitemap: 76 MB per 1.1K requests. At 10× that crawl rate, it alone approaches 1 GB/day.
- RSC: 208 MB per 79K requests; a prefetching crawler multiplies it.
- Upstash free tier: 10K commands/day. With Redis restored, **cache reads must stay optional** (fail-open) or a busy day will exhaust commands. Rate-limit counters are the priority use; page caching should prefer Next.js ISR/CDN over Redis.

No new paid service is required for the application fixes. Cloudflare Free is sufficient for the first edge layer.

---

## 9. Verification plan

Before any approved deploy, capture 24 h: requests, bandwidth, function invocations, credits, sitemap bytes, cache-hit rate.

After deploy, compare an equivalent window:

| Metric | Success looks like |
| --- | --- |
| RSC requests | >70% drop from 79.1K |
| Function invocations | Material drop (target: <50% of baseline) |
| `/sitemap.xml` bandwidth | Falls sharply; repeat requests served from cache |
| City/category invocations | Near-zero on repeat requests |
| Cache-hit rate | Rises; `x-nf-request-id` / CDN headers show HIT |
| 4xx/5xx | No increase (no broken crawlers, no 429s for real users) |
| Search Console | No crawl errors, no indexing drop |
| Upstash commands | Within free-tier quota |

**Do not claim success from a build passing.** Only post-deploy metrics count.

---

## 10. Manual steps and rollback

**Manual (owner):**

- Approve branch/PR and deploy.
- Set Netlify env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` in Production, Deploy Preview, Branch deploys as needed. Do not paste the token into the repo.
- Approve and perform Cloudflare DNS/proxy setup.
- Keep Netlify's previous deploy available for rollback.

**Rollback:** redeploy the previous Netlify build (or revert the branch). No DNS change is part of the code fix, no database migration, no env removal. Rate limits can be disabled by restoring the previous route handlers.

---

## 11. Status ledger

**Verified by audit (code read):**

- Redis client reads `REDIS_URL`; `.env.example` defines Upstash REST vars; `@upstash/redis` absent.
- `ArtistCard` links have no `prefetch` prop; 24 cards per listing page.
- Listing pages read `searchParams`, which forces dynamic rendering.
- Sitemap pulls up to 5,000 artists + combos; images sitemap is fully dynamic.
- Rate limiter is in-memory and unused on public/auth/write routes.
- `SessionProvider` has no initial session; `useSession` used in cards and favorites.
- `next.config.ts` caches only static file extensions; no page-level cache policy.

**Not verified:**

- Production env values (cannot read `.env.local` / `.env.production`; assumed per the described change).
- Actual sitemap URL count and DB query count (needs a staging measurement).
- Netlify plan limits and current credit consumption (account console).
- Whether Cloudflare is compatible with the current DNS registrar setup (needs owner confirmation).

**Implemented:** nothing yet — this report and `todo.md` only.

**Blocked on:** approval for DNS/edge changes and production env edits.

---

## 12. Recommendation

Start with the three code fixes that need no external approval and no new service:

1. `prefetch={false}` on card/list links.
2. Remove `searchParams` from canonical listing pages (static page 1 + static pagination).
3. Sitemap index with shards and a real CDN cache header.

Then restore Redis correctly and add shared limits, then put Cloudflare in front. That sequence reduces cost immediately, keeps SEO intact, and gives a measured baseline before any edge rule is allowed to block traffic.
