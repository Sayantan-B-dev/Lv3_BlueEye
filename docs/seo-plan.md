# SEO Fix Plan — Blue Eye Entertainment

Based on the audit of `blueeyeentertainmentbackup2.netlify.app`. Issues are mapped to actionable changes in this codebase.

---

## 🔴 Critical

### 1. Nuke the Keywords Meta Tag
**Problem:** `siteConfig.mainKeywords` in `lib/config/site.ts:42` spreads `artistKeywords` (~4900 lines of "book X" per artist). This is catastrophic keyword stuffing.

**Fix:**
- `lib/config/site.ts` — Strip `mainKeywords` to 10–15 core terms. Remove `...artistKeywords` spread.
- `lib/config/artist-keywords.ts` — Delete entire file (or keep but don't import).

### 2. Noindex Backup Domain
**Problem:** `blueeyeentertainmentbackup2.netlify.app` has no `noindex` directive. Google will index both domains = duplicate content penalty.

**Fix:**
- `netlify.toml` — Add `X-Robots-Tag: noindex` header for non-primary domain (or use Netlify deploy context).
- Alternative: Add `noindex` logic in `app/layout.tsx` that checks hostname against env var and sets `robots: { index: false }`.

### 3. Canonical Tags (Site-Wide)
**Problem:** `pageMetadata()` in `lib/seo/metadata.ts:36` already adds canonical per page via `alternates: { canonical: url }`. But the root `layout.tsx` static metadata does NOT include a canonical tag.

**Fix:**
- `app/layout.tsx` — Add `alternates: { canonical: siteConfig.url }` to the exported `metadata` object (line 40–105).
- Verify all page types (category, city, artist) already emit canonical via `pageMetadata()`.

---

## 🟡 Significant

### 4. JSON-LD Schema Gaps
**Problem:** `Organization` and `WebSite` schemas exist in `lib/seo/jsonld.ts` and are injected in `app/layout.tsx:124-129`. `FAQPage` is on homepage. `LocalBusiness` exists but is NOT injected anywhere.

**Fix:**
- `app/layout.tsx` — Add `localBusinessJsonLd()` alongside `organizationJsonLd()` and `websiteJsonLd()`.
- Verify `FAQPage` is rendering correctly on homepage (`app/page.tsx:79-82`).
- Ensure `Person` schema (`artistJsonLd()`) renders on all artist profile pages (`app/artists/[slug]/page.tsx`).

### 5. Open Graph & Twitter Cards
**Problem:** Already present in `pageMetadata()` and root `layout.tsx` metadata. The audit may have missed them due to JS rendering. Verify:
- `app/layout.tsx:52-77` — Open Graph and Twitter metadata already in root layout.
- `lib/seo/metadata.ts:33-55` — `pageMetadata()` returns OG + Twitter per page.
- **Action:** Confirm no page type bypasses `pageMetadata()`. Check dynamic OG image route at `/og`.

### 6. Loading Screen (LCP)
**Problem:** "Preparing your experience 0%" suggests heavy client hydration.

**Fix:**
- Investigate `<LoadingProvider>` + `<AppChrome>` in `app/layout.tsx:151-152`.
- Profile with PageSpeed Insights on the main domain.
- Defer non-critical JS, preload hero image.

### 7. Duplicate City: `/city/delhi` vs `/city/new-delhi`
**Problem:** DB has both "Delhi" and "New Delhi" as city entries → two URLs for same intent.

**Fix:**
- Normalize city values in the database: migrate "New Delhi" → "Delhi".
- `lib/services/searchService.ts` — Add a normalization map in `getDistinctCities()` for known duplicates.

### 8. `robots.txt` `Host` Directive (Yandex-Only)
**Problem:** `app/robots.ts:21` uses `host:` which Google ignores.

**Fix:**
- `app/robots.ts` — Remove `host` line (line 21). Google uses canonical tags + 301s, not this directive.

### 9. Lahore in City Targeting
**Problem:** DB has artists with city "Lahore" (Pakistan) → dilutes India geo-signal.

**Fix:**
- Add country filtering in `getDistinctCities()` to exclude non-India cities, OR
- Database cleanup: update Lahore entries to correct city or add country field.

---

## 🟢 Already Working (No Action)

| Feature | Where |
|---|---|
| Title tag + meta description | `app/page.tsx:13-17` via `pageMetadata()` |
| `lang="en-IN"` | `app/layout.tsx:114` |
| Clean URL structure | `lib/seo/slugs.ts` — `categoryPath()`, `cityPath()` |
| Sitemap | `app/sitemap.ts` — well organized |
| WebP images | preload in `app/layout.tsx:121` |
| PWA `site.webmanifest` | `public/site.webmanifest` |
| robots.txt blocks admin/api | `app/robots.ts:11-16` |
| FAQ content depth | `app/page.tsx:162-180` |
| hreflang | `app/layout.tsx:122-123` |

---

## Implementation Order

1. **Nuke keywords** — quickest win, actively harmful
2. **Add canonical to root layout** — 1-line fix
3. **Noindex backup domain** — prevent damage
4. **Host directive removal** — 1-line fix
5. **Add localBusiness JSON-LD** — reuse existing code
6. **City deduplication** — DB migration + normalization
7. **Lahore exclusion** — city filter
8. **Profile LCP** — requires PageSpeed data
