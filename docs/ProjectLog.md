# Project Log

## Current Status

Phase 1, 2, 3, and 4 completed.
MVP is functionally complete pending final polish and deployment (Phase 5).

## Latest Major Changes

- SEO/bot/sitemap hardening on branch `perf/seo-bot-sitemap-hardening`: sitemap now lists all 10,588 eligible artists across 11 shards with stable `_id` ordering, `robots.ts` uses a tested allow/block policy, legacy query URLs 301 to static routes, out-of-range shards return 404, and Artist city/search/date indexes were added. `tsc`, 30 tests, targeted ESLint, and dev smoke pass. No production build or Cloudflare change was made.
- Cost/abuse hardening on branch `perf/netlify-function-reduction`: favorites requests are now gated on authenticated sessions, homepage session/favorites fetching is de-duplicated, personalized `/api/users/*` and `/api/reviews/mine` responses send private no-store headers, `/book-artist` and `/privacy-policy` are server components with metadata, and `robots.ts` no longer advertises `/_next/image`. No production deploy, DNS, or Cloudflare rule was applied.
- Added Gmail SMTP fallback for user OTP emails (verification + password reset): sends directly to the real user inbox, bypassing the Resend sandbox `EMAIL_TO` redirect. TODO: fill real `SMTP_USER` + `SMTP_APP_PASSWORD` in `.env.local`.
- Added tilted `Recommended` badge on Google buttons (login + register views).
- Added optional `clientAddress` (300 chars) to booking inquiries: model, validation, form, admin + profile display, notification email.
- OTP spam mitigation: multipart SMTP mail, plain subjects, check-spam UI hints.
- MongoDB M0 fix: per-process pool capped at 10 (build workers spiked Atlas to ~440/500).
- Added `docs/plan_event.md` (ticketing plan, all 29 spec points).

- Implemented Auto-Backup feature for Business Inquiries and Event Management with dedicated admin triggers and duplicate backup database tables.
- Added dedicated /about and /book-artist pages, separating artist booking from the general /contact directory.
- Integrated environment-based contact directory and social media configurations on the new /contact page.
- Upgraded Admin Dashboard with full-width layout, professional SVG icons, and live inquiry management.
- Implemented advanced multi-filter (Category/City) and full-text search engine using MongoDB indexing.
- Built real-time platform statistics API to show live database counts on the homepage.
- Centralized branding system using environment variables (NEXT_PUBLIC_BRAND_NAME) and config files.
- Enhanced UI with premium glassmorphism effects for the Navbar and mobile navigation.

## Current Active Phase

Phase 5 — Final Polish + Security Hardening

## Current Priority

- Production-ready security audit (completed initial hardening)
- Performance optimization for media-heavy pages
- Final validation of artist edit/update flows

## Recently Completed

- Untracked `.env.example` (now git-ignored, local-only); committed env reference moved to `docs/env_example.md`.
- Events section freeze: one switch in `/admin/events` (plus a per-event lock in the ticketing editor) that blurs the public event pages behind a "Work ongoing" notice and blocks new ticket purchases at the API. Staff check-in, comp tickets and in-flight payment confirmations stay open.
- Cleaned up legacy/unused directories (`src/`, `scratch/`) and files (`proxy.ts`, `migrate_project.py`, `image_upload_exaple.py`).
- Regenerated the updated `folder_tree.txt` to match the clean codebase.
- Fixed `/contact` booking page spacing so the form clears the fixed Navbar on mobile.
- Added the Cloudflare cache/503 investigation branch: public HTML cache policy, private auth-page no-store headers, Mongo timeout/retry hardening, Cloudflare-aware client IPs, `/og` noindex/cache headers, and bounded cache/Redis audit scripts. Report: `docs/CLOUDFLARE_CACHE_503_AUDIT.md`. No production deploy or edge rule was applied.
- Cost-reduction branch `perf/netlify-function-reduction`: favorites fetch gated on auth, private no-store headers on personalized APIs, `/book-artist` and `/privacy-policy` converted to server components, `/_next/image` removed from robots allow, and touched API routes cleaned of lint errors. Owner build, `tsc`, tests, and targeted ESLint pass. Deploy and edge-rule verification remain pending.

## Important Decisions

- MongoDB + Mongoose selected
- NextAuth for admin auth
- ImageKit for image CDN
- App Router architecture finalized
- Single admin system preferred
- Public and admin separated completely

## Warnings / Notes

- Do not create extra models outside Artist + Inquiry
- Follow ProjectDemo.html strictly for UI
- Avoid unnecessary state libraries initially
