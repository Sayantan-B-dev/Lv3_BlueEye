# Blue Eye Entertainment Optimization Plan - Complete

**Status:** Implementation Ready  
**Created:** May 31, 2026  
**Deployed:** Netlify (blueeyeentertainment.in)  
**Current Netlify Credits:** 32 remaining ⚠️  

---

## 🎯 Executive Summary

Reduce Netlify compute costs by **40-60%** through:
1. Eliminating unnecessary `force-dynamic` (allows ISR caching)
2. Adding rate limiting to prevent brute force + spam
3. Implementing aggressive caching for search/filter endpoints
4. Fixing cache invalidation bugs on mutations

**Expected outcome:** 60% reduction in dynamic route executions → Sustainable compute usage

---

## 📊 Current State Analysis

### API Routes: 44+ Total
- **Public routes:** ~15 (search, filters, home data)
- **Authenticated routes:** ~8 (user profile, favorites)
- **Admin-only routes:** ~21+ (dashboard, management)

### Rate Limiting Status
- ❌ NO rate limiting installed
- ❌ NO `express-rate-limit` or similar packages
- **Risk:** Brute force attacks on `/api/auth/*`, DOS on `/api/search`

### Force-Dynamic Usage
- ✅ **3 home-data routes** — Already Redis cached, can remove `force-dynamic`
- ✅ **9 page routes** — Can use ISR instead (artists, events, category, city)
- ⚠️ **8 admin routes** — Keep dynamic (real-time required)
- ⚠️ **2 mutation routes** — Keep dynamic (POST/PUT/DELETE)

### Caching Status
- ✅ Redis properly configured (ioredis ^5.10.1)
- ✅ Home data cached (TTL: 600s)
- ✅ User favorites cached (TTL: 1800s)
- ❌ Search results NOT cached
- ❌ Filter results NOT cached
- ❌ Event details NOT cached
- ❌ **BUG:** No cache invalidation after mutations (stale data risk)

### Search/Filter Optimization Opportunity
| Route | Status | Optimization |
|-------|--------|---|
| `/api/filters` | No cache | Use ISR (1 hour) |
| `/api/search/suggest` | No cache, `force-dynamic` | Cache with Redis (10 min) |
| `/api/search` | No cache | Cache with Redis (5 min) |
| `/api/events/[slug]` | No cache | Cache with Redis (10 min) |

---

## 📋 Implementation Phases

### ✅ PHASE 1: Rate Limiting (2 days) — 🔴 CRITICAL

**Objective:** Prevent brute force, DOS attacks, spam

#### 1.1 Install Dependencies
- [ ] `npm install @vercel/kv` (Redis-backed, Netlify-native)
- [ ] Verify installation: `npm ls @vercel/kv`

#### 1.2 Create Rate Limiting Utility
- [ ] Create `lib/rate-limit.ts`
- [ ] Implement `createRateLimiter(key, limit, window)` function
- [ ] Use @vercel/kv for distributed tracking
- [ ] Return: `{ isLimited: boolean, remaining: number, resetAt: Date }`
- [ ] Add comments explaining the implementation

**Implementation details:**
```typescript
// Use @vercel/kv for rate limiting
// Key format: `ratelimit:${type}:${identifier}:${window}`
// Prevents brute force attacks on auth endpoints
// Handles: IP-based (public endpoints), email-based (auth), user-based (authenticated)
```

#### 1.3 Add Rate Limiting to Auth Endpoints
**Critical: Prevent credential brute force**

- [ ] `/app/api/auth/register/route.ts`
  - Limit: 5 requests per 15 minutes per email
  - Key: `ratelimit:register:${email}`
  
- [ ] `/app/api/auth/forgot-password/route.ts`
  - Limit: 3 requests per 30 minutes per email
  - Key: `ratelimit:forgot-password:${email}`
  
- [ ] `/app/api/auth/verify/route.ts`
  - Limit: 10 attempts per 15 minutes per code
  - Key: `ratelimit:verify:${code}`
  
- [ ] `/app/api/auth/reset-password/route.ts`
  - Limit: 5 attempts per 30 minutes per email
  - Key: `ratelimit:reset:${email}`

**For each route:**
- Check rate limit before processing
- Return 429 (Too Many Requests) if limited
- Include headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Add comment with rate limit policy

#### 1.4 Add Rate Limiting to Public Endpoints
**Medium priority: Prevent DOS and spam**

- [ ] `/app/api/inquiries/route.ts` (POST)
  - Limit: 5 per day per IP
  - Key: `ratelimit:inquiries:${ip}`
  
- [ ] `/app/api/search/route.ts` (GET)
  - Limit: 30 per minute per IP
  - Key: `ratelimit:search:${ip}`
  
- [ ] `/app/api/search/suggest/route.ts` (GET)
  - Limit: 60 per minute per IP
  - Key: `ratelimit:suggest:${ip}`
  
- [ ] `/app/api/reviews/route.ts` (POST)
  - Limit: 5 per day per user (authenticated)
  - Key: `ratelimit:review:${userId}`

**For each route:**
- Extract IP from headers: `x-forwarded-for` or `x-real-ip`
- Return 429 if limited
- Include rate limit headers

#### 1.5 Testing
- [ ] Unit test: Rate limit logic
- [ ] Integration test: Register endpoint (5 requests → 6th fails)
- [ ] Integration test: Search endpoint (31 requests → 31st fails)
- [ ] Verify headers are returned correctly
- [ ] Test Netlify deployment (verify @vercel/kv works)

---

### ✅ PHASE 2: Remove force-dynamic (1 day) — 🔴 CRITICAL

**Objective:** Allow Next.js to use ISR instead of executing every request

#### 2.1 Home-Data Endpoints
**These are already Redis cached, remove `force-dynamic`**

- [ ] `/app/api/home-data/route.ts`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 300;` (5 minutes)
  - Reason: Redis cached, ISR acceptable

- [ ] `/app/api/home-data/artists/route.ts`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 300;`

- [ ] `/app/api/home-data/categories/route.ts`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 300;`

#### 2.2 Events Routes
**Add ISR caching**

- [ ] `/app/api/events/route.ts`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 300;` (event list updates ~5min acceptable)

- [ ] `/app/api/events/[slug]/route.ts`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 600;` (10 minutes for individual event)

#### 2.3 Page Routes (Server Components)
**Replace `force-dynamic` with ISR**

- [ ] `/app/artists/page.tsx`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 300;`
  - Test: Page loads, data refreshes every 5 minutes

- [ ] `/app/artists/[slug]/page.tsx`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 600;`

- [ ] `/app/events/page.tsx`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 300;`

- [ ] `/app/events/[slug]/page.tsx`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 600;`

- [ ] `/app/category/[category]/page.tsx`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 600;`

- [ ] `/app/city/[city]/page.tsx`
  - Remove: `export const dynamic = 'force-dynamic'`
  - Add: `export const revalidate = 600;`

#### 2.4 Admin Routes - NO CHANGES
**Keep `force-dynamic` for admin (only admin users, need real-time)**

- `/app/admin/(dashboard)/layout.tsx` — Keep as-is
- `/app/admin/(dashboard)/events/new/page.tsx` — Keep as-is
- `/app/admin/login/layout.tsx` — Keep as-is

#### 2.5 Testing
- [ ] Build succeeds: `npm run build`
- [ ] Home page loads <500ms (cached)
- [ ] Data refreshes every 5-10 minutes (ISR revalidation)
- [ ] Admin dashboard still real-time
- [ ] No console warnings

---

### ✅ PHASE 3: Search/Filter Caching (1 day) — 🟡 HIGH

**Objective:** Cache expensive query operations (highest ROI)

#### 3.1 Create Filter Caching
**File:** `lib/cache/filters.ts`

```typescript
// Filter cache: distinct categories and cities
// Used on: artist listing page, search filters
// TTL: 3600s (1 hour) — rarely changes
// Invalidated on: artist/event mutations only
// Key: 'filters'

export async function getCachedFilters() {
  // Try cache first
  // If miss: query DB for distinct categories + cities
  // Store in Redis with TTL 3600s
  // Return cached result
}

export async function invalidateFilters() {
  // Clear 'filters' key from Redis
}
```

- [ ] Create file with `getCachedFilters()` function
- [ ] Query: `distinct categories + cities` from DB
- [ ] Cache key: `'filters'` (static data)
- [ ] TTL: 3600s (1 hour)
- [ ] Add comment explaining cache strategy
- [ ] Handle Redis unavailability gracefully

#### 3.2 Create Search Caching
**File:** `lib/cache/search.ts`

```typescript
// Search cache: query-based result caching
// Used on: /api/search route
// TTL: 300s (5 minutes) — results may vary based on DB state
// Invalidated on: artist profile changes
// Key: search:${hash(query)}:${category}:${city}:${page}

export async function getCachedSearch(query, filters, page) {
  // Key: hash query + filters + page
  // Try cache first (5 min TTL)
  // If miss: execute search query
  // Return results
}

export async function invalidateSearchCache(query?, category?, city?) {
  // If specific query: delete specific cache key
  // If any param: delete all search cache keys (use pattern matching)
}
```

- [ ] Create file with caching wrapper for search
- [ ] Cache key: `search:${hashQuery}:${category}:${city}:${page}`
- [ ] TTL: 300s (5 minutes)
- [ ] Add comments explaining invalidation strategy
- [ ] Handle cache key generation carefully

#### 3.3 Create Search Suggestion Caching
**File:** `lib/cache/search.ts` (same file)

```typescript
// Search suggestions cache: autocomplete results
// Used on: /api/search/suggest route
// TTL: 600s (10 minutes) — suggestions don't change frequently
// Invalidated on: artist profile changes
// Key: search:suggest:${query}

export async function getCachedSuggestions(query, category?, city?) {
  // Key: search:suggest:${hash(query)}:${category}:${city}
  // TTL: 600s
  // Cache top 8 suggestions
  // Return results
}
```

- [ ] Reuse same file as search caching
- [ ] Cache key: `search:suggest:${query}:${category}:${city}`
- [ ] TTL: 600s (10 minutes)
- [ ] Limit results to 8 (avoid large cache entries)

#### 3.4 Create Event Detail Caching
**File:** `lib/cache/events.ts`

```typescript
// Event detail cache: individual event data
// Used on: /api/events/[slug] route
// TTL: 600s (10 minutes)
// Invalidated on: event updates/deletes
// Key: event:${slug}

export async function getCachedEvent(slug) {
  // Key: event:${slug}
  // TTL: 600s
  // Try cache first
  // If miss: query DB for event by slug
  // Return event data
}

export async function invalidateEventCache(slug) {
  // Clear event:${slug} from Redis
}
```

- [ ] Create file for event caching
- [ ] Cache key: `event:${slug}`
- [ ] TTL: 600s (10 minutes)
- [ ] Add invalidation function

#### 3.5 Update API Routes to Use Caching

**`/app/api/filters/route.ts`**
- [ ] Remove `force-dynamic` (if present)
- [ ] Add: `export const revalidate = 3600;` (1 hour ISR)
- [ ] Call `getCachedFilters()` instead of direct DB query
- [ ] Add comment: "Distinct categories/cities rarely change"

**`/app/api/search/route.ts`**
- [ ] Call `getCachedSearch(q, filters, page)` 
- [ ] Add cache-control header: `public, max-age=300`
- [ ] Add comment: "Per-query result caching (5 min TTL)"

**`/app/api/search/suggest/route.ts`**
- [ ] Remove: `export const dynamic = 'force-dynamic'`
- [ ] Call `getCachedSuggestions(q, category, city)`
- [ ] Add cache-control header: `public, max-age=600`
- [ ] Add comment: "Search suggestions cached (10 min TTL)"

**`/app/api/events/[slug]/route.ts`**
- [ ] Call `getCachedEvent(slug)` instead of direct query
- [ ] Add cache-control header: `public, max-age=600`
- [ ] Add comment: "Individual event details cached (10 min TTL)"

#### 3.6 Testing
- [ ] Filter request 1: slow (queries DB)
- [ ] Filter request 2 within 1 hour: fast (cached) ✅
- [ ] Search results cached for 5 minutes ✅
- [ ] Suggestions cached for 10 minutes ✅
- [ ] Event details cached for 10 minutes ✅

---

### ✅ PHASE 4: Cache Invalidation (1 day) — 🟡 HIGH

**Objective:** Prevent stale data by clearing caches on mutations

#### 4.1 Create Invalidation Helper
**File:** `lib/cache/invalidate.ts`

```typescript
// Cache invalidation on mutation
// Artist create/update/delete → invalidates:
// - filters (distinct categories/cities)
// - search results (text index)
// - home-data (featured artists)
// 
// Event create/update/delete → invalidates:
// - event details cache
// - event list cache
// - home-data cache
// 
// Review create/delete → invalidates:
// - reviews marquee cache

import { invalidateFilters } from './filters';
import { invalidateSearchCache, invalidateSuggestionsCache } from './search';

export async function invalidateArtistCaches(artistId) {
  // Invalidate affected caches
  await invalidateFilters();
  await invalidateSearchCache(); // All search results
  // Invalidate home-data Redis cache too
}

export async function invalidateEventCaches(eventId) {
  // Invalidate event + home-data
}

export async function invalidateReviewCaches() {
  // Invalidate reviews marquee
}
```

- [ ] Create file with invalidation functions
- [ ] Add: `invalidateArtistCaches(artistId)`
- [ ] Add: `invalidateEventCaches(eventId)`
- [ ] Add: `invalidateReviewCaches()`
- [ ] Add: `invalidateHomeCaches()` (clears featured data)
- [ ] Each function clears related Redis keys

#### 4.2 Add Invalidation to Artist Mutations

**`/app/api/admin/artists/route.ts`** (POST - create)
- [ ] After artist created successfully
- [ ] Call: `invalidateArtistCaches(newArtist._id)`
- [ ] Add comment: "Clear filters, search, and home-data caches"

**`/app/api/artists/id/[id]/route.ts`** (PATCH - update)
- [ ] After artist updated successfully
- [ ] Call: `invalidateArtistCaches(id)`
- [ ] Add comment explaining invalidation

**`/app/api/artists/id/[id]/route.ts`** (DELETE)
- [ ] After artist deleted successfully
- [ ] Call: `invalidateArtistCaches(id)`

**`/app/api/admin/artists/[id]/route.ts`** (PUT - update)
- [ ] After artist updated
- [ ] Call: `invalidateArtistCaches(id)`

**`/app/api/admin/artists/[id]/route.ts`** (DELETE)
- [ ] After artist deleted
- [ ] Call: `invalidateArtistCaches(id)`

#### 4.3 Add Invalidation to Event Mutations

**`/app/api/admin/events/route.ts`** (POST - create)
- [ ] After event created
- [ ] Call: `invalidateEventCaches(newEvent._id)` and `invalidateHomeCaches()`

**`/app/api/admin/events/[id]/route.ts`** (PUT - update)
- [ ] After event updated
- [ ] Call: `invalidateEventCaches(id)` and `invalidateHomeCaches()`

**`/app/api/admin/events/[id]/route.ts`** (DELETE)
- [ ] After event deleted
- [ ] Call: `invalidateEventCaches(id)` and `invalidateHomeCaches()`

#### 4.4 Add Invalidation to Review Mutations

**`/app/api/admin/reviews/route.ts`** (POST - bulk import)
- [ ] After reviews imported
- [ ] Call: `invalidateReviewCaches()`

**`/app/api/reviews/route.ts`** (POST - new review)
- [ ] After review created
- [ ] Call: `invalidateReviewCaches()`

**`/app/api/reviews/route.ts`** (DELETE)
- [ ] After review deleted
- [ ] Call: `invalidateReviewCaches()`

#### 4.5 Testing
- [ ] Create artist → filters endpoint returns updated categories ✅
- [ ] Update event → event detail route shows new data ✅
- [ ] Delete artist → search results no longer show artist ✅
- [ ] Add review → marquee shows new review ✅
- [ ] No stale data visible to users

---

### ✅ PHASE 5: Optimize Remaining Routes (1 day) — 🟢 MEDIUM

#### 5.1 Add Cache Control Headers
- [ ] Static endpoints return: `Cache-Control: public, max-age=3600`
- [ ] Short-lived endpoints return: `Cache-Control: public, max-age=300`
- [ ] Dynamic endpoints return: `Cache-Control: no-store` (auth required)

#### 5.2 Review ImageKit Usage
**File:** `/app/api/admin/upload/route.ts`

- [ ] Check max image dimensions
- [ ] Verify compression is enabled
- [ ] Add comment noting optimization status
- [ ] Example: "Images optimized for web: max 1920px width, quality 80%"

#### 5.3 Verify Admin Security
**Check all admin routes:**

- [ ] Every admin endpoint checks: `if (session?.user?.role !== 'admin') return 401`
- [ ] OTP-protected operations: `/api/admin/delete-otp` has proper validation
- [ ] Add comment explaining security model
- [ ] Example: "Admin routes require verified admin role + OTP for destructive ops"

#### 5.4 Testing
- [ ] Cache headers present: `curl -i https://domain/api/filters`
- [ ] Admin operations require auth
- [ ] OTP validation works for bulk delete

---

### ✅ PHASE 6: Code Comments (0.5 days) — 🟢 LOW

**Objective:** Document caching and rate limiting logic for future maintainers

#### 6.1 Rate Limiting Comments
**`lib/rate-limit.ts`**
```typescript
// Rate limiting using @vercel/kv (Redis-backed, Netlify-native)
// Prevents: brute force attacks on auth, DOS on public endpoints, spam
// Key format: `ratelimit:${type}:${identifier}:${window}`
// Fallback: Gracefully degrade if Redis unavailable (no rate limiting applied)
```

#### 6.2 Caching Comments
**`lib/cache/*.ts`**
```typescript
// Filter cache: categories + cities (rarely change)
// TTL: 3600s (1 hour)
// Invalidated on: artist/event mutations only
// Key: 'filters'
// Fallback: Query DB directly if cache unavailable
```

#### 6.3 Invalidation Comments
**`lib/cache/invalidate.ts`**
```typescript
// Cache invalidation on mutation
// Artist: affects filters, search, home-data (cascade invalidation)
// Event: affects event details, event list, home-data
// Review: affects marquee cache only
// Implement: Delete specific Redis keys + invalidate @vercel/kv tags
```

#### 6.4 API Route Comments
**Each modified API route:**
```typescript
// Cache: Redis with 300s TTL
// Invalidation: Cleared on artist mutations
// Rate limit: 30 per minute per IP
// Fallback: Direct DB query if cache unavailable
```

#### 6.5 Testing
- [ ] Comments are clear and helpful
- [ ] No outdated comments
- [ ] All team members understand caching strategy

---

## ✅ Deployment Checklist

### Pre-Deployment Testing
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Rate limiting works locally
- [ ] Caching works locally
- [ ] Cache invalidation works locally

### Environment Variables (Netlify)
Set in **Netlify Dashboard → Site Settings → Environment:**

```
VERCEL_KV_REST_API_URL=<provided by Netlify>
VERCEL_KV_REST_API_TOKEN=<provided by Netlify>
MONGODB_URI=<existing>
NEXTAUTH_URL=https://blueeyeentertainment.in
NEXTAUTH_SECRET=<existing>
REDIS_URL=<existing>
# ... all other existing variables
```

### Netlify Domain Setup
- [ ] Primary domain: `blueeyeentertainment.in`
- [ ] Redirect from `.netlify.app` → custom domain (301)
- [ ] DNS configured correctly
- [ ] SSL certificate valid

### Deployment Steps
1. [ ] Commit changes: `git commit -m "feat: Phase 1-4 optimization (rate limit, cache, invalidation)"`
2. [ ] Push to main: `git push origin main`
3. [ ] Netlify auto-deploys
4. [ ] Verify deployment: Check Netlify build logs
5. [ ] Test on production domain

### Post-Deployment Verification
- [ ] [ ] Production site loads: https://blueeyeentertainment.in
- [ ] [ ] Rate limiting works: Try 6 registrations in 15 min → 6th fails
- [ ] [ ] Caching works: Request filters 2x → 2nd is fast
- [ ] [ ] Cache invalidation works: Create artist → filters updated
- [ ] [ ] Admin dashboard real-time: Admin operations instant
- [ ] [ ] No errors in Netlify logs
- [ ] [ ] Netlify compute usage reduced 40-60% (monitor dashboard)

---

## 📊 Success Criteria

✅ **Rate Limiting**
- [ ] Auth endpoints protected (5-10 req/15min per email)
- [ ] Public endpoints protected (30-60 req/min per IP)
- [ ] Proper 429 responses with rate limit headers
- [ ] No false positives (legitimate users not blocked)

✅ **Force-Dynamic Removal**
- [ ] 6 page routes use ISR instead of dynamic
- [ ] 3 home-data routes use ISR instead of dynamic
- [ ] Build succeeds without warnings
- [ ] Data refreshes every 5-10 minutes (acceptable)

✅ **Caching Improvements**
- [ ] Filters cached (1 hour)
- [ ] Search results cached (5 minutes)
- [ ] Suggestions cached (10 minutes)
- [ ] Event details cached (10 minutes)

✅ **Cache Invalidation**
- [ ] Artist mutations invalidate filters + search
- [ ] Event mutations invalidate event + home-data
- [ ] Review mutations invalidate marquee
- [ ] No stale data visible to users
- [ ] Zero cache invalidation bugs reported

✅ **Admin Functionality**
- [ ] Admin dashboard real-time (not affected by ISR)
- [ ] All admin operations work correctly
- [ ] OTP protection for destructive operations intact

✅ **Netlify Metrics**
- [ ] Compute usage reduced 40-60%
- [ ] Credits no longer burning rapidly
- [ ] Sustainable usage pattern achieved
- [ ] Site performance maintained or improved

---

## 📈 Performance Targets

**Before Optimization:**
- Netlify compute usage: ~X units/day (32 credits burning)
- Dynamic route executions: ~Y per day
- Average response time: TBD

**After Optimization:**
- Netlify compute usage: ~0.4X units/day (target)
- Dynamic route executions: ~0.4Y per day (reduced by ISR)
- Average response time: <500ms (ISR cached)

**Monitoring:**
- Track Netlify dashboard weekly
- Monitor response times in browser DevTools
- Check Redis cache hit/miss rates
- Verify no rate limit false positives

---

## 🔍 Files to Modify/Create

### New Files
- `lib/rate-limit.ts` — Rate limiting utility
- `lib/cache/filters.ts` — Filter caching
- `lib/cache/search.ts` — Search result + suggestion caching
- `lib/cache/events.ts` — Event detail caching
- `lib/cache/invalidate.ts` — Cache invalidation helpers

### Modified API Routes (~15 files)
- `app/api/auth/register/route.ts` — Add rate limiting
- `app/api/auth/forgot-password/route.ts` — Add rate limiting
- `app/api/auth/verify/route.ts` — Add rate limiting
- `app/api/auth/reset-password/route.ts` — Add rate limiting
- `app/api/inquiries/route.ts` — Add rate limiting (POST)
- `app/api/search/route.ts` — Add caching
- `app/api/search/suggest/route.ts` — Remove force-dynamic, add caching
- `app/api/filters/route.ts` — Add caching
- `app/api/events/route.ts` — Remove force-dynamic
- `app/api/events/[slug]/route.ts` — Remove force-dynamic, add caching
- `app/api/reviews/route.ts` — Add rate limiting (POST)
- `app/api/admin/artists/route.ts` — Add invalidation
- `app/api/admin/artists/[id]/route.ts` — Add invalidation
- `app/api/admin/events/route.ts` — Add invalidation
- `app/api/admin/events/[id]/route.ts` — Add invalidation
- `app/api/admin/reviews/route.ts` — Add invalidation (bulk)

### Modified Page Routes (~6 files)
- `app/artists/page.tsx` — Remove force-dynamic, add ISR
- `app/artists/[slug]/page.tsx` — Remove force-dynamic, add ISR
- `app/events/page.tsx` — Remove force-dynamic, add ISR
- `app/events/[slug]/page.tsx` — Remove force-dynamic, add ISR
- `app/category/[category]/page.tsx` — Remove force-dynamic, add ISR
- `app/city/[city]/page.tsx` — Remove force-dynamic, add ISR

### Config Updates
- `package.json` — Add @vercel/kv dependency

---

## 📞 Support & Troubleshooting

### Issue: Rate limit too strict
- Solution: Increase limit in `lib/rate-limit.ts`, restart server

### Issue: Stale data visible to users
- Solution: Check cache invalidation is being called, verify Redis connection

### Issue: Netlify build fails
- Solution: Check environment variables set in Netlify dashboard, verify package.json updated

### Issue: @vercel/kv not available
- Solution: Ensure `npm install @vercel/kv` completed, restart dev server

### Issue: Search cache not working
- Solution: Verify Redis running, check cache hit logs, ensure invalidation not clearing too aggressively

---

## 📅 Timeline & Effort

| Phase | Duration | Priority | Status |
|-------|----------|----------|--------|
| 1. Rate limiting | 2 days | 🔴 CRITICAL | ⏳ Ready |
| 2. Remove force-dynamic | 1 day | 🔴 CRITICAL | ⏳ Ready |
| 3. Search/filter caching | 1 day | 🟡 HIGH | ⏳ Ready |
| 4. Cache invalidation | 1 day | 🟡 HIGH | ⏳ Ready |
| 5. Remaining optimizations | 1 day | 🟢 MEDIUM | ⏳ Ready |
| 6. Code comments | 0.5 day | 🟢 LOW | ⏳ Ready |
| Testing & deployment | 1 day | — | ⏳ Ready |
| **TOTAL** | **~7 days** | — | **⏳ Ready to start** |

---

## 🚀 Next Steps

1. **Confirm deployment successful** on Netlify
2. **Start Phase 1:** Install @vercel/kv, create rate-limit utility
3. **Test locally** each phase before deploying
4. **Monitor Netlify dashboard** during and after deployment
5. **Document any issues** encountered

---

**Last Updated:** May 31, 2026  
**Status:** Implementation Ready  
**Next Action:** Start Phase 1 - Install @vercel/kv
