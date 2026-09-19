# Project Log

## Current Status

Phase 1, 2, 3, and 4 completed.
MVP is functionally complete pending final polish and deployment (Phase 5).

## Latest Major Changes

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

- Events section freeze: one switch in `/admin/events` (plus a per-event lock in the ticketing editor) that blurs the public event pages behind a "Work ongoing" notice and blocks new ticket purchases at the API. Staff check-in, comp tickets and in-flight payment confirmations stay open.
- Cleaned up legacy/unused directories (`src/`, `scratch/`) and files (`proxy.ts`, `migrate_project.py`, `image_upload_exaple.py`).
- Regenerated the updated `folder_tree.txt` to match the clean codebase.
- Fixed `/contact` booking page spacing so the form clears the fixed Navbar on mobile.

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
