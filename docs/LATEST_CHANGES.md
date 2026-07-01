# Latest Changes — Performance & SEO Optimization

## Overview

8 commits addressing high Netlify compute/bandwidth usage caused by dynamic server-side rendering and raw image serving. Root cause: 1638 artist pages + blog/events/category/city pages were all server-rendered on every request, and every `<Image>` triggered a Netlify Function for optimization.

---

## 1. Static Generation (SSG) for Public Routes

### `/artists/[slug]` — **1638 pages now static**
- **Before:** `ƒ` (dynamic, SSR every request)
- **After:** `●` (SSG, pre-rendered at build, ISR every 1h)
- **Change:** Added `generateStaticParams` via `getArtistsForSitemap()`
- **File:** `app/artists/[slug]/page.tsx`

### `/blog/[slug]` — All blog posts static
- **Before:** `ƒ` → **After:** `●` (SSG + ISR 1h)
- **File:** `app/blog/[slug]/page.tsx`

### `/events/[slug]` — All events static
- **Before:** `ƒ` → **After:** `●` (SSG + ISR 1h)
- **File:** `app/events/[slug]/page.tsx`

### `/category/[category]` & `/city/[city]` — Paths pre-declared
- Added `generateStaticParams` via `getDistinctCategories()` / `getDistinctCities()`
- Still `ƒ` at build due to `searchParams` (pagination/filters), but ISR caches them
- Only 12 categories + 14 cities — negligible dynamic cost

### Routes remaining `ƒ` (by design)
| Route | Reason |
|---|---|
| `/artists` | `searchParams` for pagination, filters, search |
| `/blog` | `searchParams` for pagination, category filter |
| `/events` | `searchParams` for status, category filter |
| `/search` | Dynamic search queries |

---

## 2. Bandwidth Reduction — Images

### Next.js Image Optimization Disabled
- **File:** `next.config.ts`
- Added `images.unoptimized: true`
- Previously every `<Image>` triggered a `/_next/image?url=...` Netlify Function invocation per request
- Since all images are served from **ImageKit CDN**, optimization is redundant and costly
- **Impact:** Eliminates all `/_next/image` serverless invocations

### ImageKit Transformation Parameters
All image URLs now include CDN-level resize + format optimization:

| Location | Transform | Sizing |
|---|---|---|
| Artist profile hero | `w-600,h-800,f-webp,q-80` | 600×800 WebP at 80% |
| Artist gallery thumbs | `w-250,h-250,f-webp,q-70` | 250×250 WebP at 70% |
| Artist card thumbnails | `w-400,h-300,f-webp,q-70` | 400×300 WebP at 70% |

**Files:**
- `lib/seo/metadata.ts` — New `imageKitUrl()` helper
- `app/artists/[slug]/page.tsx` — Profile + gallery images
- `components/ui/ArtistCard.tsx` — Listing thumbnails

### Caching Headers
- **File:** `netlify.toml`
- Added `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` for:
  - `/images/*` path
  - All image extensions (`.png`, `.jpg`, `.webp`, `.avif`, etc.)
- CDN serves cached images for 1 day, allows stale for 7 days while revalidating

---

## 3. AI Crawler Blocking
- **File:** `app/robots.ts`
- Added explicit `disallow: "/"` for:
  - `GPTBot`, `ClaudeBot`, `CCBot`, `Bytespider`, `Amazonbot`, `PerplexityBot`, `Applebot-Extended`
- These bots were likely contributing significantly to the 70k requests/day

---

## 4. Build Output Comparison

| Route | Before | After | Count |
|---|---|---|---|
| `/artists/[slug]` | `ƒ` | `●` SSG + ISR 1h | 1638 |
| `/blog/[slug]` | `ƒ` | `●` SSG + ISR 1h | ~5 |
| `/events/[slug]` | `ƒ` | `●` SSG + ISR 1h | ~? |
| `/artists` | `ƒ` | `ƒ` (searchParams) | — |
| `/blog` | `ƒ` | `ƒ` (searchParams) | — |
| `/events` | `ƒ` | `ƒ` (searchParams) | — |
| `/category/[category]` | `ƒ` | `ƒ` (ISR) | 12 |
| `/city/[city]` | `ƒ` | `ƒ` (ISR) | 14 |
| `/search` | `ƒ` | `ƒ` (inherently dynamic) | — |

## 5. Other
- **Commit workflow** documented in `AGENTS.md`: run `npm run build` before every commit
- Each change was built, verified, and committed independently
