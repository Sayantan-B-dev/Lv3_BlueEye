# DONE — BlueEye abuse / cost containment

**Updated:** 2026-10-23
**Source:** checked items moved from `todo.md`; implementation on `perf/netlify-function-reduction` and `perf/seo-bot-sitemap-hardening`.
**Pending:** `todo.md` · **Manual/owner:** `todo_mannual.md`

## 2026-10-23 implementation — `perf/seo-bot-sitemap-hardening`

- [x] Database audit (read-only): 10,588 artists; all 10,588 have slug/name/category; 244 missing city, 1,000 missing image, 4 missing about; zero duplicate name groups; 12 categories, 584 cities, 253 category+city combinations with count ≥ 3.
- [x] Confirmed existing indexes: `_id`, sparse unique `id`, unique `slug`, `name`, `category`, and text. Added `location.city`, `search.city_lower + search.category_lower`, `createdAt`, and `updatedAt` indexes.
- [x] Sitemap includes all 10,588 eligible artists instead of stopping at 1,000/5,000; 1,000 URLs per shard and a 50,000-URL protocol safety cap.
- [x] Artist shards sort by `_id` for stable pagination; duplicate `skip` call removed; sitemap count query is uncapped.
- [x] `generateStaticParams` remains at 5,000 artists to avoid a build-time regression; sitemap and on-demand ISR cover the rest.
- [x] `robots.ts` now uses pure `buildRobotsRules()`: public pages allowed for search/social, private routes disallowed, AI/SEO scrapers blocked, `/_next/image` not advertised.
- [x] Avoided explicit Googlebot/Bingbot groups because specific groups override `*` and would drop private disallows.
- [x] Legacy query URLs now 301 to static routes: `?page=`, `?category=`, `?city=` on `/artists`; `?page=` on `/blog`; `?status=` on `/events`; pagination on city/category/blog-category paths.
- [x] Out-of-range sitemap shards now return 404 instead of an empty 200 sitemap.
- [x] Extracted `localRateLimit()` and `clientIpFromHeaders()` into dependency-free `lib/utils/rateLimitCore.ts`.
- [x] Added tests for robots policy, sitemap shard math, legacy redirects, local rate limits/client IP, and auth-before-data ordering in all seven private API routes.
- [x] `npm test` passes 30/30; `npx tsc --noEmit` and targeted ESLint pass.
- [x] Dev smoke: `/robots.txt` has the new policy; `/sitemap.xml` lists 11 artist shards; `artists-1.xml` has 1,000 URLs; `artists-11.xml` has 588; `artists-12.xml` returns 404; all legacy sample redirects return 301 to canonical paths.
- [x] Confirmed live Cloudflare still reports `DYNAMIC` for `/`, `/artists`, and `/sitemap.xml`; edge cache rules are required.
- [x] Confirmed production robots is stale until deploy; no production build, deploy, DNS, or Cloudflare change was made.

## 2026-10-22 audit findings

- [x] Favorites 401 cause identified: `FavoritesProvider` fetches `/api/users/favorites` on mount without checking auth; the API itself checks auth before any DB work.
- [x] Session audit: one `SessionProvider`, no polling, and no duplicate provider. `Navbar` still triggers one initial session hydration request per page.
- [x] `/artists` confirmed ISR with `revalidate = 3600`; high invocations are a Netlify handler/Cloudflare cache issue, not dynamic rendering.
- [x] `/api/artists` GET confirmed to have a 60-second public cache and a per-instance limiter.
- [x] Sitemap architecture confirmed: index plus shards with caching; category–city threshold is 3; 275 invocations.
- [x] `robots.ts` matched the recommended policy except for the extra `"/_next/image"` allow entry.
- [x] Prior branch/deployment status reviewed: `main` at `cb57a9c`; investigation branch not deployed.

## 2026-10-22 implementation — `perf/netlify-function-reduction`

- [x] `components/providers/FavoritesProvider.tsx` now gates the initial GET on `status === "authenticated"`; unauthenticated visitors make no favorites request.
- [x] Anonymous empty results are no longer written to `sessionStorage`; the favorites cache is cleared when the session becomes unauthenticated.
- [x] Favorites fetch no longer sends a request for logged-out visitors; authenticated fetch remains one request per tab session.
- [x] `components/home/HomeDynamicContent.tsx` no longer calls `useSession()` or fetches favorites independently.
- [x] `components/home/FeaturedArtists.tsx` removed the unused `favorites` prop.
- [x] Private API responses added via `privateApiSuccess` / `privateApiError` in `lib/utils/apiResponse.ts`.
- [x] `/api/users/favorites`, `/api/users/profile`, `/api/users/inquiries`, `/api/users/applications`, `/api/users/applications/[id]`, `/api/users/tickets`, and `/api/reviews/mine` now return `Cache-Control: private, no-store, max-age=0` plus `CDN-Cache-Control`/`Netlify-CDN-Cache-Control: no-store`.
- [x] Private API headers are set at the route level because `next.config.ts` `headers()` was verified not to override them for App Router route handlers in this Next version.
- [x] `app/book-artist/page.tsx` converted from a client page to a server component with `pageMetadata`.
- [x] `app/privacy-policy/page.tsx` converted from a client page to a server component with `pageMetadata`.
- [x] `app/robots.ts` wildcard allow list no longer includes `"/_next/image"`.
- [x] Dev smoke confirmed `/book-artist`, `/privacy-policy`, `/artists`, and `/sitemap.xml` return 200.
- [x] Dev smoke confirmed `/api/users/favorites` and `/api/users/profile` return 401 with private no-store headers and no public cache headers.
- [x] `npx tsc --noEmit` passed.
- [x] `npm test` passed (7 cache-policy tests).
- [x] Targeted `npx eslint` passed for every file changed in this branch, including all seven API routes.
- [x] Removed unused `NextResponse` imports, replaced `any` session casts with typed fields, extended `types/next-auth.d.ts` with `id`/`username`, and added `getErrorMessage()` for unknown errors.
- [x] Owner approved the favorites gating direction.
- [x] Owner confirmed `npm run build` passes after the changes.
- [x] Full-repo lint still reports pre-existing debt (~405 problems); none were introduced by this branch.
- [x] `todo.md` wording gaps patched: sitemap inclusion criteria, category/city caching, request-pattern challenges, and robots.txt voluntary wording.

## Redis, cache, and rate limiting

- [x] `lib/db/redis.ts` rewritten as a server-only Upstash REST client using `fetch`; deliberate `ioredis` fallback when `REDIS_URL` is set.
- [x] Redis exports updated: `redisMode`, `isRedisConfigured`, `redisCommand`, `redisIncr`, `redisHealth`, `getCache`, `setCache`, `invalidateCache`.
- [x] 1.5-second command timeout; sanitized warnings; no URL/token logging.
- [x] `.env.example` kept to placeholder values only.
- [x] Shared atomic limiter implemented with Redis `INCR` + `EXPIRE NX` + `TTL`; local bucket fallback added.
- [x] Fail-open policy for public GET/auth and fail-closed policy for costly writes; fail-closed returns 503 + `Retry-After`.
- [x] `clientIp()` prefers `cf-connecting-ip`, then Netlify, then proxy headers.
- [x] Limits applied to search, artists GET, contact, inquiries, applications, register, password reset, NextAuth credentials, and ticket routes.
- [x] Public GET limits moved to per-instance `rateLimitLocal`; auth/write limits use shared Redis where configured.
- [x] Query validation added: `q` ≤ 80, category/city ≤ 60, page ≤ 50/100, limit ≤ 24; invalid values return 400.
- [x] `apiSuccess` public cache TTLs applied: search/artists 60 seconds, stats 300 seconds.
- [x] Redis health probe added at `app/api/health/redis/route.ts`; admin-only, no credentials returned.
- [x] Explicit `cache: "no-store"` removed from the Redis REST fetch so pages can remain static/ISR.
- [x] Rollback path documented in `report.md`; no DNS or DB migration is part of the changes.

## RSC, static routes, and sitemap

- [x] `components/ui/ArtistCard.tsx` — `prefetch={false}`.
- [x] `components/events/EventCard.tsx` — `prefetch={false}`.
- [x] `components/layout/Footer.tsx` — city/category links use `prefetch={false}`.
- [x] `app/blog/page.tsx` — post links use `prefetch={false}`.
- [x] New city/category/artist listings — card, pagination, and related links use `prefetch={false}`.
- [x] Primary navigation, homepage cards/banners, and account links use `prefetch={false}`.
- [x] `app/city/[city]/page.tsx` — page 1 static/ISR with `generateStaticParams`.
- [x] `app/city/[city]/page/[page]/page.tsx` — static-path pagination, ISR.
- [x] `components/city/CityArtistsView.tsx` — shared server view.
- [x] `app/category/[category]/page.tsx` — page 1 static/ISR.
- [x] `app/category/[category]/page/[page]/page.tsx` — paginated route.
- [x] `components/category/CategoryArtistsView.tsx` — shared view with filter bar in `Suspense`.
- [x] `app/artists/page.tsx` — page 1 static/ISR.
- [x] `app/artists/page/[page]/page.tsx` — paginated route.
- [x] `components/artists/ArtistsBrowseView.tsx` — shared view.
- [x] Filters navigate to `/search`; static listing pages no longer read client `searchParams`.
- [x] `lib/seo/slugs.ts` — `cityPagePath`, `categoryPagePath`, `artistPagePath`.
- [x] `blog` and `events` no longer read `searchParams`; category/status filters use static routes.
- [x] Sitemap index added at `app/sitemap.xml/route.ts`.
- [x] Sitemap shards added at `app/sitemaps/[id]/route.ts` (initially `pages` + `artists-1…artists-5`, later 11 artist shards on 2026-10-23), 1,000 URLs per artist shard, ISR 24 hours.
- [x] Sitemap index and shards set `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`.
- [x] `lib/seo/sitemapData.ts` centralizes entries and de-duplicates URLs. The original 5,000 artist cap was removed on 2026-10-23.
- [x] Invalid sitemap `lastModified` values are omitted.
- [x] `lib/services/artistService.ts` — added `countArtistsForSitemap` and `getArtistsForSitemapRange`.
- [x] `app/images-sitemap.xml/route.ts` — `force-static`, ISR 24 hours, CDN cache header.
- [x] Owner build confirmed `/sitemap.xml` as static and `/sitemaps/[id]` as generated.
- [x] `Netlify-CDN-Cache-Control` added to public page sources.
- [x] CDN cache headers extended to sitemaps, robots, and manifest.

## Session and favorites

- [x] `components/providers/FavoritesProvider.tsx` no longer called `useSession`; one `/api/users/favorites` request per tab session cached in `sessionStorage`.
- [x] `components/ui/ArtistCard.tsx` no longer calls `useSession` or `useRouter`.
- [x] `SessionProvider` no longer refetches on window focus; interval refetch disabled.
- [x] Prior claim that public pages no longer request `/api/auth/session` needs revalidation because `Navbar` still calls `useSession()` globally.
- [x] Prior favorites implementation is superseded by pending P0-1: it prevents repeated requests but allows anonymous 401 requests.

## Security, headers, and assets

- [x] `proxy.ts` matcher narrowed to `/city/:path*` and `/category/:path*`; slug redirects preserve `/page/N` and query strings.
- [x] Deploy-preview `noindex` moved to `next.config.ts` using Netlify `CONTEXT`.
- [x] Public GET cache headers added: search/artists 60 seconds, stats 300 seconds.
- [x] Robots reviewed: public routes allowed; private routes disallowed; AI crawler groups present; sitemap references absolute.
- [x] Auth pages removed from shared caching; `/login`, `/register`, `/reset-password`, `/profile`, `/switch-account`, `/search`, admin, and ticket routes send `private, no-store`.
- [x] `/og` cache headers added (1 year immutable), input caps and image-host allowlist added, self-fetch removed.
- [x] `/og` 500s fixed by replacing Satori `inline-block` with `flex`; local default and artist images return 200 PNG.
- [x] ImageKit transforms added for homepage hero/trail/cards, blog covers, and event covers.
- [x] Homepage artist aggregation projected to rendered fields; cache key bumped to `:v2`.
- [x] Font preload trimmed; `PlasmaWave` and `MagicBento` split into lazy chunks.
- [x] `components/ui/GlobalEyeBackground.tsx` caches both frames as data URLs in `localStorage`; first load network fallback retained.
- [x] `app/layout.tsx` no longer preloads `/eye.webp`.
- [x] `netlify.toml` image/font cache headers added.
- [x] Mongo connection hardened with 5-second selection/connect timeouts and rejected-promise reset.

## Follow-up completed

- [x] `/blog`, `/blog/page/[page]`, and `/blog/category/[category]` no longer read `searchParams`; page 1 is static.
- [x] `/events` and `/events/status/[status]` use static status routes.
- [x] `/category/[category]/[city]` page 1 is static; `/page/[page]` handles pagination.
- [x] `/api/filters` and `/api/home-data` retain their existing ISR/cache behavior.
- [x] `robots.txt` disallows AhrefsBot, SemrushBot, MJ12bot, Amzn-SearchBot, and meta-externalagent.
- [x] Owner production build confirmed `○ /`, `/blog`, `/events`, `/login`, `/profile` and `● /blog/category/[category]`, `/events/status/[status]`, `/category/[category]/[city]`.
- [x] `npx tsc --noEmit` passed.
- [x] Dev smoke tests passed for home, blog, events, category/city, artists, sitemap, login, and robots.
- [x] `Netlify-CDN-Cache-Control` confirmed locally on `/login` and `/artists`.
- [x] Dev page weight reduced from 55 requests / 2.10 MB to 53 requests / 1.21 MB wire; images reduced from 909 KB to 77 KB.

## Investigation completed

- [x] Baseline captured: 8.35% Cloudflare hit rate, ~37.02K dynamic requests, 602 503s, 10 500s, zero edge rate-limit actions.
- [x] Confirmed Cloudflare does not cache extensionless HTML; Netlify CDN caches it while Cloudflare reports `DYNAMIC`.
- [x] Confirmed RSC responses use `text/x-component` on the same URL; cache rules must bypass RSC/prefetch.
- [x] Confirmed auth pages use `private, no-store`.
- [x] Shared `s-maxage`/`stale-while-revalidate` headers added for public HTML and sitemaps.
- [x] `netlify.toml` asset cache headers added.
- [x] `clientIp()` changed to prefer Cloudflare’s client IP.
- [x] `/og` cache headers, input caps, and SSRF protection added.
- [x] `npm test`, `npm run test:redis`, and `npm run audit:cloudflare` scripts added; local checks passed.
- [x] Manual Cloudflare Cache/WAF/rate-limit rules and rollback steps written.
- [x] Owner production build passed after the investigation changes.

## Owner verification completed

- [x] Previous owner-run production build passed for the route refactor.
- [x] Later OG/cache/prefetch/session edits were validated with `tsc --noEmit` and dev smoke tests.
- [x] Rollback path documented; no DNS or DB migration is involved.
