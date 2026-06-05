# Blue Eye Entertainment — Global Audit & SEO Optimization Plan

---

## 📊 Executive Summary

**Project:** Artist Booking Platform (Next.js 16, MongoDB, Redis)  
**Domain:** blueeyeentertainment.in  
**Deployed on:** Vercel (primary) + Netlify (secondary)  

Status: MVP complete. Phases 1-4 done. Phase 5 (security/performance) in progress.  
SEO improvements implemented: content expansion, blog section, GA4, pagination, root cleanup.

---

## ✅ What's Already Done Well (SEO)

| Area | Status | Notes |
|------|--------|-------|
| XML Sitemap | ✅ Dynamic | Includes static + dynamic (artists, events, categories, cities) |
| Robots.txt | ✅ Clean | Blocks `/admin/`, `/api/`, `/login`, `/profile`, `/reset-password` |
| Canonical URLs | ✅ Via `pageMetadata()` | Every page has alternates.canonical |
| Open Graph Tags | ✅ | title, description, image, locale, siteName |
| Twitter Cards | ✅ | summary_large_image with creator handle |
| JSON-LD Structured Data | ✅ | Organization, Website, FAQPage, BreadcrumbList, Event, Artist, LocalBusiness |
| Favicon Set | ✅ | Multiple sizes + apple-touch-icon + android-chrome |
| Web Manifest | ✅ | site.webmanifest with theme_color, background_color |
| Google/Bing Verification | ✅ | google77db56515cdc1333.html + meta tags |
| Responsive Design | ✅ | Tailwind v4, mobile-friendly |
| URL Normalization Middleware | ✅ | Slugifies /category/:path and /city/:path with 301 redirect |
| Security Headers | ✅ | X-Content-Type-Options, X-Frame-Options, X-Robots-Tag |
| Static Asset Caching | ✅ | 1-year immutable cache on static assets |
| Schema Markup in Layout | ✅ | organizationJsonLd + websiteJsonLd in root head |
| Page-Level Metadata | ✅ | generateMetadata on artists, events, category, city pages |
| Breadcrumb JSON-LD | ✅ | On profile, category, and city pages |
| Blog Section | ✅ | `/blog` route with listing, detail, model, sitemap, Article JSON-LD |
| Article JSON-LD | ✅ | `articleJsonLd()` in jsonld.ts for blog posts |
| Category/City SEO Content | ✅ | 300-500 words dynamic content via `lib/seo/content.ts` |
| Pagination | ✅ | Category + city listing pages (24/page) |
| Google Analytics 4 | ✅ | gtag script in layout via `NEXT_PUBLIC_GA_ID` |
| Image Sitemap | ✅ | `/images-sitemap.xml` with artist photos + event covers |
| Descriptive Image Alt Text | ✅ | ArtistCard images include name, category, city |
| `lastmod` in Sitemap | ✅ | Category + city entries have dynamic `lastmod` from DB |
| `hreflang` Tags | ✅ | en + x-default alternates in layout |
| `theme-color` Meta Tag | ✅ | `#d4a017` (gold) in layout head |
| LCP Preload | ✅ | eye.webp preload uncommented with `fetchPriority="high"` |
| Unique Meta Descriptions | ✅ | `categoryMetaDescription()` + `cityMetaDescription()` per type/city |
| Preconnect to ImageKit | ✅ | `Link: <https://ik.imagekit.io>; rel=preconnect` in headers |
| Performance Monitoring | ✅ | WebVitals component reports CWV to GA4 |
| Dynamic OG Images | ✅ | `/og` edge route renders custom OG (title, photo, category) per page |
| Artist-Specific OG | ✅ | Artist pages show name + photo + category in OG card |
| Category/City OG | ✅ | Category/city pages show name + type badge in OG card |
| API Route Caching | ✅ | `Cache-Control` headers on 7 public API routes, ISR via `revalidate` |
| CSP Headers | ✅ | `Content-Security-Policy` restricting script/img/font sources |

---

## 🛑 SEO Gaps — Critical to Fix

### 🔴 P0 — Must Fix (High Impact)

| # | Issue | Location | Impact | Status |
|---|-------|----------|--------|--------|
| 1 | **Category/City pages content-thin** | `app/category/[category]/page.tsx`, `app/city/[city]/page.tsx` | High | ✅ Done — `lib/seo/content.ts` generates 300-500 words per page |
| 2 | **No Blog / Content Marketing** | Missing entirely | High | ✅ Done — `/blog` route with model, listing, detail, sitemap |
| 3 | **No Google Analytics 4** | Missing entirely | High | ✅ Done — gtag script in layout via `NEXT_PUBLIC_GA_ID` |
| 4 | **No Search Console monitoring** | Verification file exists but not used | High | ⏳ Manual — submit sitemap in GSC dashboard |
| 5 | **No pagination on artist listings** | Category + city pages used `limit: 100` | High | ✅ Done — 24/page with prev/next + numbered pages |
| 6 | **OG image is identical logo for all pages** | `pageMetadata()` uses `siteConfig.ogImage` | Medium | ✅ Done — dynamic OG via `/og` route with title, image, category per page type |

### 🟡 P1 — Should Fix (Medium Impact)

| # | Issue | Location | Impact | Status |
|---|-------|----------|--------|--------|
| 7 | **No image sitemap** | Missing | Medium | ✅ Done — `app/images-sitemap.xml/route.ts` with artist + event images |
| 8 | **ArtistCard images lack descriptive alt text** | `components/ui/ArtistCard.tsx` | Medium | ✅ Done — alt includes name, category, city |
| 9 | **Category/City pages have no `lastmod` in sitemap** | `app/sitemap.ts` | Medium | ✅ Done — `getLatestCategoryUpdates` + `getLatestCityUpdates` in sitemap |
| 10 | **No breadcrumb JSON-LD on artists list page** | `app/artists/page.tsx` | Medium | ✅ Already existed — no change needed |
| 11 | **No `hreflang` tags** | `app/layout.tsx` | Low | ✅ Done — en + x-default alternates added |
| 12 | **No `theme-color` meta tag** | `app/layout.tsx` | Low | ✅ Done — `#d4a017` (gold) |
| 13 | **Preload comment for eye.webp** | `app/layout.tsx:117` | Low | ✅ Done — uncommented with `fetchPriority="high"` |
| 14 | **Category/city meta descriptions templated** | Category + city pages | Medium | ✅ Done — `categoryMetaDescription()` + `cityMetaDescription()` with unique text per type |
| 15 | **No `Link` headers for preconnect to ImageKit** | `next.config.ts` | Medium | ✅ Done — preconnect header added |
| 16 | **No performance monitoring** | Missing | Medium | ✅ Done — `WebVitals` component using `useReportWebVitals` + GA4 events |
| 17 | **No social media preview per artist** | `app/artists/[slug]/page.tsx` | Medium | ✅ Done — artist photo + name + category rendered in `/og` route |
| 18 | **search page has `noIndex`** | `app/search/page.tsx` | Correct | ✅ Already done |

---

## 🔧 Technical SEO — Improvements

| # | Improvement | Status |
|---|-------------|--------|
| 1 | **Preconnect to ImageKit** | ✅ Done — `Link: <https://ik.imagekit.io>; rel=preconnect` in headers |
| 2 | **Add `Cache-Control` headers to API routes** | ✅ Done — home-data(300s), events(300s), event-detail(600s), search(300s), suggest(600s), filters(3600s) |
| 3 | **Enable ISR on more pages** | ✅ Done — replaced `force-dynamic` with `revalidate` on 7 public API routes |
| 4 | **Add HTTP security headers (CSP)** | ✅ Done — `Content-Security-Policy` in next.config.ts |
| 5 | **Enable Brotli compression** | ✅ Vercel default |
| 6 | **Verify Core Web Vitals** | ⏳ Manual — run PageSpeed Insights after deploy |

---

## 📝 Content Strategy — Recommended

| Content Type | Frequency | Target Keywords | Priority |
|-------------|-----------|-----------------|----------|
| **Blog Posts** | 4-6/month | Long-tail booking queries | 🔴 High |
| **Category Guides** | One per category | "book [category] artists india" | 🔴 High |
| **City Guides** | One per major city | "[city] event entertainment" | 🟡 Medium |
| **Artist Spotlights** | Weekly | "[artist name] booking" | 🟢 Low |
| **Industry News** | Monthly | "event entertainment trends india" | 🟢 Low |

### Blog Topic Ideas
- "How to Book a Singer for Your Wedding in India — Complete Guide 2026"
- "Top 10 DJs for Corporate Events in Mumbai, Delhi & Bangalore"
- "How Much Does It Cost to Hire a Celebrity for an Event in India?"
- "Bollywood vs Indie Artists — Which Is Right for Your Event?"
- "Artist Booking Checklist — 7 Things to Ask Before You Book"
- "Best Wedding Entertainment Ideas for Indian Weddings 2026"

---

## 🌐 Off-Page SEO

| Tactic | Effort | Impact | Timeline |
|--------|--------|--------|----------|
| Google Business Profile setup | Low | High | Week 1 |
| Entertainment directories (eventfaqs, humaraevent) | Medium | Medium | Week 2-3 |
| Guest posts on event/wedding blogs | High | High | Month 2+ |
| Press releases for major bookings | Medium | Medium | Ongoing |
| Influencer collaborations | High | High | Month 3+ |
| Wedding planner partnerships | Medium | High | Month 2+ |

---

## 🗑️ Unnecessary Files in Root — Cleanup ✅ Done

| File | Action Taken |
|------|-------------|
| **`linkedin.txt`** | ✅ Deleted + removed from git tracking |
| **`API_ROUTES_ANALYSIS.txt`** | ✅ Moved to `docs/` |
| **`folder_tree.txt`** | ✅ Deleted + removed from git tracking |
| **`ProjectTree.py`** | ✅ Deleted + removed from git tracking |
| **`CLAUDE.md`** | ✅ Deleted + removed from git tracking |
| **`.env.local.copy`** | ✅ Deleted (was already gitignored) |
| **`.next/`** | Already gitignored — no action needed |
| **`next-env.d.ts`** | Keep (auto-generated, required by TS) |
| **`AGENTS.md`** | Keep (in use) |
| **`todo.md`** | Keep (active document) |
| **`docs/deep-research-report.md`** | Already in `docs/` ✅ |

---

## 📈 Performance Targets (Post-Optimization)

| Metric | Current (est.) | Target |
|--------|---------------|--------|
| Lighthouse Performance | ~60-70 | >85 |
| LCP | ~3-4s | <2.5s |
| CLS | ~0.15 | <0.1 |
| INP | ~250ms | <200ms |
| Dynamic Route Executions | High | -40-60% via ISR |
| Search Result Caching | None | 5-min Redis TTL |
| Filter Caching | None | 1-hour Redis TTL |

---

## ⏱️ Implementation Roadmap

### ✅ Phase A — Quick Wins (Week 1)
- [x] Add GA4 script to layout (via `NEXT_PUBLIC_GA_ID`)
- [x] Delete unnecessary root files (linkedin.txt, folder_tree.txt, ProjectTree.py, CLAUDE.md, .env.local.copy)
- [x] Move API_ROUTES_ANALYSIS.txt → docs/
- [x] Add `theme-color` meta tag (#d4a017)
- [x] Add `preconnect` to ImageKit in next.config headers
- [x] Uncomment `preload` for eye.webp (fetchPriority="high")
- [x] Add breadcrumb JSON-LD on /artists page (already existed)
- [x] Add `hreflang` tags (en + x-default)
- [x] Add performance monitoring (WebVitals component with GA4 events)

### ✅ Phase B — Content Depth (Week 2-3)
- [x] Expand category pages with 300-500 words SEO content (via `lib/seo/content.ts`)
- [x] Expand city pages with 300-500 words SEO content (via `lib/seo/content.ts`)
- [x] Unique meta descriptions for category/city (via `categoryMetaDescription` + `cityMetaDescription`)
- [x] Image sitemap (`/images-sitemap.xml` with artist + event images)
- [x] Dynamic OG images per page (`/og` edge route, artist photo + name + category)

### ✅ Phase C — Technical SEO (Week 3-4)
- [x] Implement pagination on category + city listing pages (24 per page)
- [x] Add `lastmod` to category/city sitemap entries (via aggregate queries)
- [x] ArtistCard descriptive alt text (name + category + city)
- [x] Add `Cache-Control` headers (home-data:300s, events:300s, event:600s, search:300s, suggest:600s, filters:3600s)
- [x] Add CSP headers (`Content-Security-Policy` in next.config.ts)
- [x] Configure ISR — replaced `force-dynamic` with `revalidate` on 7 public API routes
- [ ] Add Redis caching for search/filters — already planned in existing todo

### Phase D — Content Marketing (Month 2+)
- [x] Create `/blog` section with listing + detail pages + MongoDB model
- [x] Add blog sitemap entries
- [x] Add `articleJsonLd` structured data
- [ ] Publish 4-6 blog posts/month
- [ ] City & category guide pages
- [ ] Guest posting & directory outreach

### Phase E — Ongoing
- [ ] Google Business Profile reviews
- [ ] Backlink building
- [ ] Monthly SEO performance review
- [ ] Content calendar maintenance

---

## 📋 Existing Optimization Plan (from previous todo)

**Already documented in earlier plan — kept for reference:**

### PHASE 1-6 (from existing implementation)

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Rate Limiting | ⏳ Ready | Install @vercel/kv, protect auth + public endpoints |
| 2. Remove force-dynamic | ⏳ Ready | Replace with ISR revalidation on home-data + page routes |
| 3. Search/Filter Caching | ⏳ Ready | Redis cache for filters, search, suggestions, events |
| 4. Cache Invalidation | ⏳ Ready | Clear Redis keys on artist/event/review mutations |
| 5. Remaining Optimization | ⏳ Ready | Cache headers, ImageKit review, admin security |
| 6. Code Comments | ⏳ Ready | Document caching + rate limiting logic |

**Total effort:** ~7 days for existing + 2-3 weeks for new SEO improvements

---

## 🚀 Deployment Checklist

- [x] Delete unnecessary root files before push
- [x] Add GA4 env var (`NEXT_PUBLIC_GA_ID`) to `.env.example`
- [x] Ensure `.env.local.copy` is removed and gitignored
- [ ] Set `NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX` in `.env.local` and Vercel/Netlify
- [ ] Build succeeds: `npm run build`
- [ ] Lighthouse audit > 85 performance
- [ ] Submit new sitemap to Google Search Console
- [ ] Verify all redirects work (middleware + netlify.toml)
- [ ] Ensure first blog post is created via MongoDB

---

## 📁 New Files Created

| File | Purpose |
|------|---------|
| `lib/seo/content.ts` | Dynamic SEO content generators for category + city pages |
| `lib/models/BlogPost.ts` | Mongoose model for blog posts |
| `lib/services/blogService.ts` | CRUD + sitemap service for blog |
| `app/blog/page.tsx` | Blog listing with category filter + pagination |
| `app/blog/[slug]/page.tsx` | Blog detail with Article JSON-LD + breadcrumbs |
| `app/images-sitemap.xml/route.ts` | Image sitemap with artist + event images |
| `components/analytics/WebVitals.tsx` | Core Web Vitals reporting to GA4 |
| `app/og/route.tsx` | Dynamic OG image generator (edge, next/og) |
| `lib/seo/og.ts` | OG image URL builder helper |

---

**Last Updated:** June 5, 2026  
**Next Priority:** Deploy to production → Start content calendar → Implement remaining Phase C items (Cache-Control, ISR)
