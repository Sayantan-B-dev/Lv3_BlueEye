# TODO — BlueEye abuse / cost containment

**Updated:** 2026-10-23
**Branch:** `perf/seo-bot-sitemap-hardening` (from `main` at `2f36c7b`)
**Status:** all code-actionable items are complete. Remaining work needs owner build/deploy, Cloudflare access, or production telemetry.
**Archives:** Completed work: `todo_done.md` · Manual/owner work: `todo_mannual.md`
**Audit:** `docs/CLOUDFLARE_CACHE_503_AUDIT.md` · `report.md`

## Remaining

- [ ] Run the owner build for this branch; deploy to staging only after it passes.
- [ ] Browser-test logged-out and logged-in favorites, login redirects, and `/my-ticket`.
- [ ] Apply Cloudflare cache rules for public HTML/APIs and bypass RSC/prefetch.
- [ ] Apply Cloudflare bot/WAF/rate-limit rules; confirm Googlebot/Bingbot and social previews still pass.
- [ ] Verify repeated `/`, `/artists`, and `/sitemap.xml` requests become Cloudflare HITs.
- [ ] Capture post-deploy 24h metrics: requests, invocations, hit rate, bandwidth, errors, p50/p95.
- [ ] Confirm `/sitemap.xml` lists 11 artist shards and Search Console reports no coverage errors.
- [ ] Verify deployed `/og`, `/robots.txt`, and sample legacy query redirects.
- [ ] Run `npm run test:redis` if staging/production Upstash credentials are provided.
- [ ] Confirm the Redis module remains server-only in the owner build output.
- [ ] Create Turnstile keys and browser-test register/login/contact/inquiry/application flows.
- [ ] Measure session traffic before approving lazy Navbar/account hydration.

Details and rule expressions are in `todo_mannual.md`. Do not claim cost savings until deployed telemetry confirms them.
