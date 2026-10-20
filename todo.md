# TODO — BlueEye abuse / cost containment

**Updated:** 2026-10-21
**Branch:** currently `main` (no implementation branch created yet)
**Build:** not run — deferred by request (last build attempt was blocked by a stale/other `next build` lock)
**Production changes deployed:** none

Reference telemetry (Netlify, one period): **92,686 requests · 428.9 MB · RSC 79.1K requests / 208 MB / 47.7K function invocations**.

---

## Progress at a glance

| Area | Status |
| --- | --- |
| Redis client / env mismatch | Implemented — live connectivity not tested |
| RSC prefetch storm | Implemented — effect not measured |
| Static city/category/artists pages | Implemented — build output not verified |
| Sitemap index + shards | Implemented — sizes/URL counts not measured |
| Shared rate limiting | Implemented — concurrency/expiry tests not run |
| Session / favorites requests | Implemented |
| Edge (Cloudflare / Netlify rules) | **Blocked** — needs DNS approval, no changes made |
| Production metrics (P2) | **Blocked** — no deploy, no baseline captured |
| Background image localStorage cache | Implemented — runtime not observed |

---

## Ground rules

- No production deploy, no live DNS change, no production env edits without explicit approval.
- No synthetic load testing, no DDoS simulation, no crawler spoofing.
- No geo-blocking, no Chrome-UA blocking, no blanket `noindex`.
- Never log or commit `UPSTASH_REDIS_REST_TOKEN`.
- `npm run build` was deliberately not run after the last edits.

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
- [x] Primary navigation links keep default prefetch.
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
- [ ] Cache-hit behavior (`MISS` then `HIT`, zero repeat invocations) not verified — needs a running server.
- [ ] `blog` and `events` still read `searchParams` and remain dynamic; not part of this P0 item, still a known residual cost.

### P0-4. Shrink and cache `/sitemap.xml` — implemented

- [x] Replaced single `app/sitemap.ts` with a cached **sitemap index** at `app/sitemap.xml/route.ts`.
- [x] Shards at `app/sitemaps/[id]/route.ts` (`pages`, `artists-1…artists-5`), 1,000 URLs per artist shard, `generateStaticParams`, ISR 24 h.
- [x] `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` on index and shards.
- [x] `lib/seo/sitemapData.ts` — one place for entries; URL de-duplication; cap 5,000 artist URLs (unchanged intent).
- [x] Invalid `lastModified` values are omitted instead of throwing/serializing `Invalid Date`.
- [x] `lib/services/artistService.ts` — added `countArtistsForSitemap` and `getArtistsForSitemapRange` (slug + updatedAt only).
- [x] `app/images-sitemap.xml/route.ts` — `force-static`, ISR 24 h, CDN cache header.
- [ ] Actual URL counts by type, compressed/uncompressed size and DB query count not measured (needs runtime + DB access).
- [ ] `generateSitemaps`-style index behavior replaced by explicit routes — intended to avoid uncertainty; route resolution not build-verified.

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

1. **No build has been run since these edits.** TypeScript (`tsc --noEmit`) and ESLint on the new/changed files pass, but route conflicts and prerender behavior are unconfirmed.
2. A stale/other `next build` lock delayed verification; no build was started by this session afterwards.
3. Redis behavior in production is unverified; missing/invalid credentials fall back to per-instance limits and no shared cache.
4. City/category pagination URLs are new (`/city/x/page/2`); old `?page=` links still resolve to page 1 and should be redirected later if needed.
5. Filters now land on `/search` (dynamic, low volume) instead of filtering in place on category pages — intentional trade-off to make listings static.
6. `blog` and `events` listing pages remain dynamic (read `searchParams`) and still invoke functions on every request.
7. Cloudflare is the only layer that can absorb a real flood; none of that is configured.

---

## Do not

- Do not block Singapore, Chrome UAs, all bots, or all AI agents.
- Do not add `noindex`/`Disallow: /` to save credits.
- Do not cache authenticated or personalized responses publicly.
- Do not add a paid service beyond what is already in use without approval.
- Do not treat a passing build as proof of traffic reduction.
