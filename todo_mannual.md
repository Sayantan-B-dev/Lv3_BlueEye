# MANUAL TODO — BlueEye abuse / cost containment

**Updated:** 2026-10-23
**Scope:** only actions the owner/user must perform outside code. Code work is in `todo.md`; completed work is in `todo_done.md`.
**Rule:** never commit credentials, tokens, or exported customer data.

## 1. Prerequisites and approvals

- [ ] Provide the `/api/users/favorites` status-code breakdown (401 vs 403 vs 5xx) or export the relevant Netlify/Cloudflare logs.
- [ ] Confirm whether production is running `2f36c7b` or later; the supplied favorites/session metrics may predate the current code.
- [ ] Confirm the staging Netlify branch/site name and provide access to staging function logs and Cloudflare request logs.
- [ ] Confirm whether Cloudflare DNS/proxy changes are approved; no production rule changes should happen before staging validation.
- [ ] Decide separately whether lazy Navbar/account hydration is acceptable as a follow-up UX tradeoff.
- [ ] Confirm who approves production deployment.
- [ ] Confirm Redis/Upstash credentials exist for staging and production; run `npm run test:redis` and report the result.

## 2. Baseline and verification

- [ ] Capture a 24-hour staging or production baseline for request count, function invocations, cache hit rate, bandwidth, p50/p95, errors, and Mongo query volume.
- [ ] Smoke-test the staged build: `/`, `/artists`, `/api/artists`, `/blog`, `/events`, `/category/singer/mumbai`, `/login`, `/sitemap.xml`, `/robots.txt`, and `/og?title=Test`.
- [ ] Confirm `/sitemap.xml` lists 11 artist shards, `artists-11.xml` returns 200 with 588 URLs, and `artists-12.xml` returns 404.
- [ ] Confirm sample legacy URLs 301 to static paths: `/artists?page=2`, `/artists?category=Singer&city=Mumbai&page=2`, `/events?status=upcoming`, `/blog?page=2`.
- [ ] Verify logged-out and logged-in favorites behavior manually in a browser.
- [ ] Capture post-change 24-hour metrics and compare against the baseline.
- [ ] Re-run `npm run audit:cloudflare` or provide equivalent Cloudflare/Netlify exports after deployment.
- [ ] Enable Netlify usage alerts for function invocations and bandwidth.
- [ ] Start Search Console monitoring for indexing, crawl errors, and sitemap coverage.
- [ ] Verify deployed `/og` responses after the next build.

## 3. Cloudflare configuration

- [ ] Apply cache rules for public HTML and public listing APIs; use a 5–15 minute TTL for listings and 1 hour for legal/static pages.
- [ ] Bypass RSC/prefetch requests (`RSC`, `Next-Router-Prefetch`, `text/x-component`) from shared HTML cache rules.
- [ ] Confirm private routes (`/login`, `/profile`, `/api/users/*`, `/api/auth/*`, admin, tickets, writes) are never shared-cached.
- [ ] Apply edge rate limits: `/api/search` 30/min/IP; `/api/artists` 60/min/IP; auth/login 10/min plus an hourly cap; writes 10/min; add burst protection.
- [ ] Enable managed security rules/bot protections and block obvious configuration probes (`/.env.local`, `/wrangler.toml`, etc.).
- [ ] Keep Googlebot/Bingbot access to valuable SEO pages; do not block by country or browser UA alone.
- [ ] Keep `/api/ticketing/webhook/razorpay` excluded from rate-limit/block rules.
- [ ] Optional: add a Transform Rule to strip `utm_*`, `fbclid`, and `gclid` so query strings do not fragment the cache.
- [ ] Correlate the 602 reported 503s with Netlify/Cloudflare logs and record the cause.
- [ ] Record before/after cache hit rate and function invocation counts for each rule.

## 4. Turnstile

- [ ] Create Turnstile site and secret keys in Cloudflare.
- [ ] Provide the keys through the approved environment/secret store; do not commit them.
- [ ] Turnstile wiring already exists for register, login, contact, inquiry, and application forms; browser-test each flow after the keys are set.

## 5. SEO and sitemap decisions

- [ ] Review category–city page count distribution and SEO performance before approving any threshold change from 3 to 5.
- [ ] Decide whether any `/search` landing pages should be indexable; keep them noindex/disallowed if they are not intended to rank.
- [ ] Review sitemap coverage and low-value URLs after deployment; do not rebuild the sitemap architecture.
- [ ] Confirm all 10,588 eligible artists are listed across 11 shards; 244 missing-city, 1,000 missing-image, and 4 missing-about profiles were intentionally retained.
- [ ] Monitor Search Console after deploy; 5,000 artist profiles are pre-rendered at build time and the rest render on demand via ISR.
- [ ] Confirm Google/Bing can access canonical artist, category, city, event, and blog pages.

## 6. Deployment and rollback

- [ ] Deploy the approved branch to staging first; do not deploy production until staging cache/rate-limit behavior is verified.
- [ ] Approve production deployment only after the owner build and staging smoke tests pass.
- [ ] Roll back to the previous Netlify build if cache, auth, favorites, or SEO behavior regresses.
- [ ] Record the final deployed commit and the date/time of each Cloudflare rule change.
