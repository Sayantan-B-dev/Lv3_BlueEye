# TODO — BlueEye abuse / cost containment

**Updated:** 2026-10-21
**Branch:** currently `main` (no implementation branch created yet)
**Build:** owner-run on 2026-10-21: passed (5,479 static pages). A second round of edits (OG cache/hardening, auth-page CDN headers, prefetch/session changes) was made after that build and still needs an owner rebuild.
**Production changes deployed:** none

Reference telemetry (Netlify, two periods): **92,686 requests · 428.9 MB · RSC 79.1K requests / 208 MB / 47.7K function invocations**; latest 24 h: **88,513 requests · ~0.87% errors**. Top offenders: `/login` 6.3K, `/privacy-policy` 5.1K, `/contact` 5K, `/book-artist` 5K, `/about` 4.8K, `/for-artists` 4.7K, `/` 4.1K, `/sitemap.xml` 1.1K / 73.84 MB, `/og` 423 (24.6% errors).

---

## Progress at a glance

| Area | Status |
| --- | --- |
| Redis client / env mismatch | Implemented — live connectivity not tested |
| RSC prefetch storm | Implemented for cards, footer, navbar and homepage — effect not measured |
| Static city/category/artists pages | Implemented — page 1 confirmed `○`/`●` in owner build |
| `/blog` + `/events` static routes | Implemented — confirmed `○`; pagination routes remain dynamic |
| Sitemap index + shards | Implemented — confirmed `○`/`●`; bandwidth not yet measured |
| Shared rate limiting | Implemented — public GETs now local-only; concurrency/expiry tests not run |
| Session / favorites requests | Implemented — focus refetch disabled |
| Edge (Cloudflare / Netlify rules) | **Blocked** — needs DNS approval, no changes made |
| Production metrics (P2) | **Blocked** — no deploy, post-change report not captured |
| Background image localStorage cache | Implemented — runtime not observed |

---

## Ground rules

- No production deploy, no live DNS change, no production env edits without explicit approval.
- No synthetic load testing, no DDoS simulation, no crawler spoofing.
- No geo-blocking, no Chrome-UA blocking, no blanket `noindex`.
- Never log or commit `UPSTASH_REDIS_REST_TOKEN`.
- The owner runs `npm run build` manually; the agent verifies with `npx tsc --noEmit`, lint and dev smoke tests.

---

## P0 — Stop the bleeding

### P0-1. Fix the Redis client / env-var mismatch — implemented

**Evidence (unchanged):** old code read `REDIS_URL` and built an `ioredis` client; env now provides `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`; `@upstash/redis` is not installed.

- [x] `lib/db/redis.ts` rewritten as a server-only Upstash **REST** client using `fetch` (no new dependency), with a deliberate `ioredis` TCP fallback when `REDIS_URL` is set.
- [x] Exports `redisMode`, `isRedisConfigured`, `redisCommand`, `redisIncr`, `redisHealth`, plus the existing `getCache` / `setCache` / `invalidateCache` API.
- [x] 1.5 s command timeout; sanitized warnings (no URL/token); no credential logging.
- [x] `.env.example` untouched (still placeholder values only).
- [ ] Live round-trip against Upstash not run (no credentials available locally).
- [ ] Client-bundle exclusion not build-verified (module is server-only by usage; no client imports).

### P0-2. Kill the RSC prefetch storm — implemented

- [x] `components/ui/ArtistCard.tsx` — `prefetch={false}` (24 cards per grid no longer preload 24 artist RSC payloads).
- [x] `components/events/EventCard.tsx` — `prefetch={false}`.
- [x] `components/layout/Footer.tsx` — all 12 city/category links `prefetch={false}`.
- [x] `app/blog/page.tsx` — post links `prefetch={false}`.
- [x] New city/category/artists listings — card, pagination and related links `prefetch={false}`.
- [x] Primary navigation, homepage cards/banners and account links now `prefetch={false}` too.
- [ ] Before/after RSC request counts not measured (requires deploy).

### P0-3. Make city/category/artist listings cacheable — implemented

Root cause: pages destructured `searchParams`, forcing dynamic rendering despite `revalidate`.

- [x] `app/city/[city]/page.tsx` — page 1, no `searchParams`, `generateStaticParams`, ISR 1 h.
- [x] `app/city/[city]/page/[page]/page.tsx` — static-path pagination, ISR 1 h.
- [x] `components/city/CityArtistsView.tsx` — shared server view.
- [x] `app/category/[category]/page.tsx` — page 1, no `searchParams`.
- [x] `app/category/[category]/page/[page]/page.tsx` — paginated route.
- [x] `components/category/CategoryArtistsView.tsx` — shared view, filter bar inside `Suspense`.
- [x] `app/artists/page.tsx` — page 1, no `searchParams`.
- [x] `app/artists/page/[page]/page.tsx` — paginated route.
- [x] `components/artists/ArtistsBrowseView.tsx` — shared view.
- [x] Filters now navigate to `/search` (`components/ui/ArtistFilterBar.tsx`); no client component reads `searchParams` on a static listing page.
- [x] `lib/seo/slugs.ts` — `cityPagePath`, `categoryPagePath`, `artistPagePath`.
- [ ] Cache-hit behavior (`MISS` then `HIT`, zero repeat invocations) not verified on Netlify — needs deploy.
- [x] `blog` and `events` no longer read `searchParams`; filters use `/blog/category/...` and `/events/status/...` (see follow-up).

### P0-4. Shrink and cache `/sitemap.xml` — implemented

- [x] Replaced single `app/sitemap.ts` with a cached **sitemap index** at `app/sitemap.xml/route.ts`.
- [x] Shards at `app/sitemaps/[id]/route.ts` (`pages`, `artists-1…artists-5`), 1,000 URLs per artist shard, `generateStaticParams`, ISR 24 h.
- [x] `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on index and shards.
- [x] `lib/seo/sitemapData.ts` — one place for entries; URL de-duplication; cap 5,000 artist URLs (unchanged intent).
- [x] Invalid `lastModified` values are omitted instead of throwing/serializing `Invalid Date`.
- [x] `lib/services/artistService.ts` — added `countArtistsForSitemap` and `getArtistsForSitemapRange` (slug + updatedAt only).
- [x] `app/images-sitemap.xml/route.ts` — `force-static`, ISR 24 h, CDN cache header.
- [ ] Actual URL counts by type, compressed/uncompressed size and DB query count not measured (needs DB metrics).
- [x] Route resolution confirmed by the owner build: `/sitemap.xml` `○`, `/sitemaps/[id]` `●` (6 shards).

### P0-5. Shared, atomic rate limiting — implemented

- [x] `lib/utils/rateLimit.ts` rewritten: Redis `INCR` + `EXPIRE … NX` + `TTL` in one pipeline; per-instance fallback bucket.
- [x] Explicit fail-open (public GET, auth) vs fail-closed (writes) policy; fail-closed returns `503` + `Retry-After`.
- [x] `clientIp()` prefers `x-nf-client-connection-ip`, then `x-real-ip`, then `x-forwarded-for`.
- [x] Applied: `/api/search` (30/min), `/api/artists` GET (60/min), `/api/contact` (3/10 min), `/api/inquiries` (3/10 min), `/api/artist-applications` (2/h), register (3/15 min + 5/h/email), forgot-password (3/15 min + 3/h/email), reset-password (5/15 min), NextAuth credentials callback (5/min + 20/h), ticket routes converted to async limiter.
- [x] Parameter validation: `q` ≤ 80 chars, category/city ≤ 60, page ≤ 50/100, limit ≤ 24, `NaN`/non-numeric rejected with `400`; `lib/utils/requestValidation.ts`.
- [x] `apiSuccess` TTL used for public GET caching (60 s search/artists, 300 s stats); `/api/filters` and `/api/home-data` keep their existing ISR caches.
- [ ] Atomicity, expiry, multi-instance and Redis-outage behavior not exercised.
- [ ] `/api/search` and `/api/artists` route-level limits not load-tested (by request: no synthetic traffic).

### P0-6. Stop per-page session round-trips — implemented

- [x] `components/providers/FavoritesProvider.tsx` no longer calls `useSession`; one `/api/users/favorites` request per tab session, cached in `sessionStorage`.
- [x] `components/ui/ArtistCard.tsx` no longer calls `useSession` or `useRouter`.
- [x] `/api/auth/session` is no longer requested by public pages that do not mount an auth-only component.
- [ ] Not browser-verified (no runtime session test).

### P0-7. Edge protection for actual DDoS — **blocked, not done**

- [ ] Cloudflare proxy/WAF/Bot Fight Mode — requires DNS/nameserver approval.
- [ ] Origin SSL Full (strict), cache rules, edge rate limit — not configured.
- [ ] Netlify path-based rate limiting as interim — not configured.
- [ ] No DNS, production env or security rule was changed.

---

## P1 — Hardening

- [x] `proxy.ts` matcher narrowed to `/city/:path*` and `/category/:path*` (no middleware cost on static pages/APIs); slug redirects preserve `/page/N` and query strings.
- [x] Deploy-preview `noindex` moved to `next.config.ts` using Netlify `CONTEXT` (preview behavior preserved).
- [x] Public GET cache headers added: search/artists 60 s, stats 300 s; filters 3600 s and home-data 300 s already existed.
- [x] Sitemap `lastModified` validated before serialization.
- [x] Robots reviewed: public routes allowed; `/admin/`, `/api/`, `/login`, `/profile`, `/reset-password` disallowed; AI crawler groups present; sitemap references absolute via `siteUrl`; no change required.
- [x] Redis health probe added at `app/api/health/redis/route.ts`, admin-only, no credentials returned.
- [x] Query-length/page-size caps implemented on public APIs.
- [ ] Static/ISR status of `/book-artist`, `/contact`, `/privacy-policy`, `/about`, `/for-artists` not verified without build output (source shows client/static pages with no server `searchParams`).
- [ ] CSP re-check deferred (no new third-party origins were added; Upstash is server-side only).

---

## P2 — Verification and rollback — **blocked**

- [ ] Baseline of 24 h requests/bandwidth/function invocations/credits not captured (no production access).
- [ ] Post-deploy comparison not possible without deployment.
- [ ] Search Console monitoring not started.
- [x] Rollback path documented in `report.md`: redeploy previous Netlify build or revert the branch; no DNS or DB migration is part of these changes.
- [ ] Function-invocation reduction not claimed — no metrics.

---

## Additional change (not in original phases)

- [x] `components/ui/GlobalEyeBackground.tsx` — both frames cached forever in `localStorage["blueeye:eye-background:v1"]` as data URLs; renders only from cache after the first visit; graceful network fallback.
- [x] `app/layout.tsx` — removed the `preload` of `/eye.webp` that forced a fetch on every load.

---

## Residual risks / known gaps

1. **The owner build passed for the route refactor**, but the later OG/cache/prefetch/session edits were made after it and are not build-verified yet. `tsc --noEmit` and dev smoke tests pass.
2. The second round is intentionally left for the owner to rebuild; do not run `npm run build` from an agent session.
3. Redis behavior in production is unverified; missing/invalid credentials fall back to per-instance limits and no shared cache.
4. City/category pagination URLs are new (`/city/x/page/2`); old `?page=` links still resolve to page 1 and should be redirected later if needed.
5. Filters now land on `/search` (dynamic, low volume) instead of filtering in place on category pages — intentional trade-off to make listings static.
6. Blog/event **listing page 1** is static; paginated routes (`/blog/page/[page]`, `/blog/category/[category]/page/[page]`) remain dynamic.
7. Cloudflare is the only layer that can absorb a real flood; none of that is configured.

---

## Follow-up — 2026-10-21 (bot / credit hardening)

- [x] `/blog` + `/blog/page/[page]` + `/blog/category/[category]` (+ pagination) — no `searchParams`, static page 1.
- [x] `/events` + `/events/status/[status]` — status filters are static routes.
- [x] `/category/[category]/[city]` — static page 1; `/page/[page]` for pagination.
- [x] `Netlify-CDN-Cache-Control` on public page sources (`next.config.ts`).
- [x] ImageKit transforms for homepage hero/trail/cards, blog covers, event covers (`lib/utils/imagekit.ts`).
- [x] Homepage artist aggregation projected to rendered fields (`lib/services/artistService.ts`); cache key bumped to `…:v2`.
- [x] Public GET limits moved to per-instance (`rateLimitLocal`) so Upstash commands are reserved for writes/auth.
- [x] Font preload trimmed; `PlasmaWave` and `MagicBento` split into lazy chunks.
- [x] Removed explicit `cache: "no-store"` from the Redis REST fetch so pages can stay static/ISR.
- [x] `robots.txt` disallows AhrefsBot / SemrushBot / MJ12bot; also Amzn-SearchBot and meta-externalagent.
- [x] Production build (owner-run) confirms `○ /`, `/blog`, `/events`, `/login`, `/profile` and `● /blog/category/[category]`, `/events/status/[status]`, `/category/[category]/[city]`.
- [x] CDN cache headers extended to auth pages (`/login`, `/register`, `/reset-password`, `/profile`, `/switch-account`), sitemaps, robots, manifest.
- [x] `/og` cache headers (1y immutable) + input caps + image-host allowlist + no self-fetch logo (fixes SSRF/error-rate risk).
- [x] `SessionProvider` no longer refetches on window focus; prefetch disabled on nav/home links to cut RSC function calls.
- [x] Verified `npx tsc --noEmit`; dev smoke test passes for home, blog, events, category/city, artists, sitemap, login, robots.
- [x] Confirmed `Netlify-CDN-Cache-Control` on `/login` and `/artists` locally.
- [x] Dev page weight after image transforms: 55 → 53 requests, 2.10 MB → 1.21 MB wire, images 909 KB → 77 KB.

- [ ] Cloudflare proxy/WAF/Bot Fight Mode + edge rate limits — needs DNS approval.
- [ ] Turnstile/CAPTCHA on contact, inquiries, applications, register/login — needs site keys.
- [ ] `/artists/page/[page]`, `/city/[city]/page/[page]`, `/category/[category]/page/[page]`, `/category/[category]/[city]/page/[page]` remain dynamic; page 1 is static.
- [ ] Legacy `?page=` / `?category=` / `?status=` URLs render page 1 (no redirect), same tradeoff as city/category.
- [ ] Cloudflare Transform Rule to strip `utm_*` / `fbclid` / `gclid` — query strings fragment the CDN cache.
- [ ] Netlify usage alerts (function invocations, bandwidth) not configured.
- [x] `/og` 500s fixed (Satori `inline-block` -> `flex`); local default and artist images return 200 PNG.
- [ ] Verify `/og` on the deployed site after the rebuild.

### Final steps (owner, in order)

1. Rebuild + deploy the second round (`npm run build`). The previous build predates the OG, auth-page cache, prefetch and session edits.
2. Smoke-test the deploy: `/`, `/blog`, `/events`, `/category/singer/mumbai`, `/login`, `/sitemap.xml`, `/robots.txt`, and `/og?title=Test`.
3. Enable Netlify usage alerts for function invocations and bandwidth; wait 24 h and compare against the reference numbers above.
4. Cloudflare (needs DNS approval): follow `docs/CLOUDFLARE_TURNSTILE_SETUP.md`. Free plan supports 5 custom WAF rules (one UA-block rule), 10 cache rules, and **one** rate limiting rule limited to 10 s windows / 10 s block / IP counting / Block action. Keep `/api/ticketing/webhook/razorpay` excluded.
5. Turnstile: create site + secret keys (free; no DNS change required), then wire verification into contact, inquiry, application, register and login forms as described in the same doc.
6. Only if telemetry still shows meaningful paginated-route cost, add `generateStaticParams` for the top pagination routes.

## Do not

- Do not block Singapore, Chrome UAs, all bots, or all AI agents.
- Do not add `noindex`/`Disallow: /` to save credits.
- Do not cache authenticated or personalized responses publicly.
- Do not add a paid service beyond what is already in use without approval.
- Do not treat a passing build as proof of traffic reduction.
