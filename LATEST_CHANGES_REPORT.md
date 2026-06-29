# Latest Changes Report — Performance & SEO Audit

**Date:** 2026-06-30
**Scope:** Netlify compute/bandwidth optimization, SSG migration, image optimization, crawler management
**Total Commits:** 8

---

## Changes Summary

| # | Commit | Category | Impact |
|---|---|---|---|
| 1 | `generateStaticParams` → `/artists/[slug]` | SSG | 1638 pages `ƒ` → `●` |
| 2 | AI crawler blocking in `robots.txt` | SEO | ~7 AI bots blocked |
| 3 | `generateStaticParams` → `/blog/[slug]`, `/events/[slug]` | SSG | All blog/event pages `ƒ` → `●` |
| 4 | `generateStaticParams` → `/city/[city]`, `/category/[category]` | SSG | Paths pre-declared (ISR) |
| 5 | `images.unoptimized: true` in `next.config.ts` | Bandwidth | Eliminates `/_next/image` Function calls |
| 6 | ImageKit transformation params on all image URLs | Bandwidth | WebP + resize at CDN level |
| 7 | Caching headers in `netlify.toml` | Bandwidth | `stale-while-revalidate` for images |
| 8 | Build-before-commit workflow in `AGENTS.md` | Workflow | Prevents untested commits |

---

## Files Changed (9 files)

```
app/artists/[slug]/page.tsx         (SSG + ImageKit transforms)
app/blog/[slug]/page.tsx            (SSG)
app/events/[slug]/page.tsx          (SSG)
app/category/[category]/page.tsx    (generateStaticParams)
app/city/[city]/page.tsx            (generateStaticParams)
app/robots.ts                       (AI crawler blocking)
components/ui/ArtistCard.tsx        (ImageKit card transforms)
lib/seo/metadata.ts                 (imageKitUrl helper)
next.config.ts                      (images.unoptimized)
netlify.toml                        (caching headers)
AGENTS.md                           (build workflow)
```

---

## Verification Results

### 1. Route Symbols — ✅ PASS
```
Before: ƒ /artists/[slug]   After: ● /artists/[slug]   (1638 paths)
Before: ƒ /blog/[slug]      After: ● /blog/[slug]      (5 blog posts)
Before: ƒ /events/[slug]    After: ● /events/[slug]
```

### 2. Static Path Count — ✅ PASS
```
1635 more paths  →  1638 artists total
2 more paths     →  5 blog posts total
```

### 3. Next.js Image Optimization — ✅ DISABLED
```
grep _next/image in pre-rendered HTML → 0 matches
```
All `<Image>` components now render as native `<img>` tags. No serverless invocations for image resizing.

### 4. ImageKit Transformations — ✅ APPLIED
```
img src: ik.imagekit.io/5we3srin0/tr:w-600,h-800,f-webp,q-80/... ✅
```
Confirmed in pre-rendered artist HTML. All sizes covered:
- Profile hero: 600×800 WebP q80
- Gallery: 250×250 WebP q70
- Cards: 400×300 WebP q70

### 5. Robots.txt — ✅ VERIFIED
```
curl http://localhost:3456/robots.txt

User-agent: GPTBot        → Disallow: /
User-agent: ClaudeBot     → Disallow: /
User-agent: CCBot         → Disallow: /
User-agent: Bytespider    → Disallow: /
User-agent: Amazonbot     → Disallow: /
User-agent: PerplexityBot → Disallow: /
User-agent: Applebot-Extended → Disallow: /
```

### 6. Caching Headers — ✅ CONFIGURED
```toml
Cache-Control: public, max-age=86400, stale-while-revalidate=604800
```
Applies to `/images/*` and all image extensions. Deploy to Netlify to verify response headers.

---

## Expected Impact After Deployment

| Metric | Before | Expected After |
|---|---|---|
| `/_next/image` requests | High (every image) | **~0** |
| Artist page Function invocations | High (every request) | **~0** (SSG) |
| Compute credits/day | 15-20 | **<2** |
| Bandwidth/day | ~1.3 GB | **Lower** (WebP + smaller sizes) |
| Total requests | ~70k/day | Similar (crawlers still crawl) |
| Artist page load | SSR (cold every hour) | **Instant** (pre-rendered HTML) |

---

## Remaining Dynamic Routes (by design)

These use `searchParams` for pagination/filters and cannot be fully static:

| Route | Reason |
|---|---|
| `/artists` | Pagination, category/city/search filters |
| `/blog` | Pagination, category filter |
| `/events` | Status and category tabs |
| `/search` | Dynamic query-based search |
| `/category/[category]` | Pagination + city/search filters (26 pages) |
| `/city/[city]` | Pagination + category/search filters (14 pages) |

All remaining `ƒ` routes still benefit from ISR (`revalidate = 3600`).

---

## Commit History

```
af38037 docs: add build-before-commit workflow to AGENTS.md
9ee9e83 perf: add image caching headers with stale-while-revalidate in netlify.toml
ded9cab perf: add ImageKit transformation params to all image URLs
d78586b perf: disable Next.js image optimization on Netlify
cd854d1 feat: add generateStaticParams to /city/[city] and /category/[category]
1be66d8 feat: add generateStaticParams to /blog/[slug] and /events/[slug]
67c09df feat: block AI crawlers in robots.txt
7d0e57f feat: add generateStaticParams to /artists/[slug]
```
