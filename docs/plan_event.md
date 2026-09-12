# BlueEye Event Ticketing — Implementation Plan

> Progress: Phase 1 DB ✅ · Phase 2 service ✅ · Phase 3 public APIs ✅ · Phase 4+ pending (branch `feat/event-ticketing`).

Event: **Rang De Bhakti** · Target capacity: **800 tickets** · Gateway: **Razorpay**
Decisions (2026-09-12): guest checkout · one buyer + auto ticket IDs · fees configurable (defaults 0%).

---

## 0. Architecture review

| Area | Current state |
|------|---------------|
| Framework | Next.js 16 App Router + React 19 (`package.json`) |
| Backend | Route Handlers (`app/api/**`) |
| Database | MongoDB Atlas + Mongoose 9 |
| Auth | NextAuth 4 — Google + Credentials, JWT sessions (`lib/auth/authOptions.ts`); admin guard `requireAdmin()` + `role === "admin"` checks |
| Email | Resend + Gmail SMTP fallback, luxury HTML template (`lib/utils/email.ts`) |
| Images | ImageKit CDN (covers event poster/banner — no new image infra) |
| Cache | Redis/Upstash keys + TTLs (`lib/config/cache.ts`), cooldown helper (`lib/auth/cooldown`) |
| Tracking | GA4 only (`NEXT_PUBLIC_GA_ID`); **no Meta Pixel, no payments, no QR** (SRS lists payments as future) |
| Events today | `Event` + `EventRegistration` (RSVP: Pending→Approved/Rejected/Waitlisted) + `EventUpdate`; public list/detail pages (ISR 3600s); admin CRUD + registrations + backup |

**Razorpay integrates directly** — `razorpay` SDK server-side (order create + webhook verify) + `checkout.js` popup client-side. No other service required.

### Secrets the owner must supply
1. `RAZORPAY_KEY_ID` (+ `NEXT_PUBLIC_RAZORPAY_KEY_ID` — same value, public)
2. `RAZORPAY_KEY_SECRET` (server only — create Razorpay order)
3. `RAZORPAY_WEBHOOK_SECRET` (server only — **separate** value from Dashboard → Settings → Webhooks; verifies §5)
4. Later (Phase 2): `META_PIXEL_ID`, `META_CAPI_TOKEN`, WhatsApp provider credentials

### New npm deps
`razorpay`, `qrcode`, `@types/qrcode` (dev). No PDF lib (print-friendly HTML ticket), no scanner lib (native `BarcodeDetector` + manual fallback), no Meta SDK (raw `fbq` + `fetch`).

---

## 1. Event page (§1) — `/events/rang-de-bhakti`

New event record (seed script or admin create) with additive optional fields on `Event`:
`ticketing{enabled:true, feePct:0, feeFlatPaise:0, gstPct:0, maxPerOrder:6}`,
`highlights[]`, `termsConditions`, `refundPolicy`, `contactInfo{name,phone,email}`.

Page renders (existing layout + additive blocks): name, poster/banner (ImageKit), date, time, venue, description, artist info, highlights, terms, cancellation/refund policy, contact info.

Ticket table (admin-configurable `TicketTier` docs):

| Ticket | Price | Total |
|--------|-------|-------|
| General | ₹599 | 300 |
| Premium | ₹999 | 250 |
| VIP | ₹1,499 | 150 |
| VVIP | ₹2,599 | 100 |

`app/events/[slug]/page.tsx` change is **additive only**: if `ticketing.enabled` show `TicketWidget`, else existing `EventRegistrationForm`. No other page touched.

## 2. Ticket selection (§2)

`TicketWidget`: category select + qty stepper (capped by live `remaining` + `maxPerOrder`), server-priced quote showing unit price × qty, platform fee, GST, **final amount**. Oversell guard is backend (§15); UI cap is convenience only.

## 3. Customer info (§3)

Guest checkout collects required: full name, mobile, email; optional: DOB, city. **One buyer per order**; backend auto-generates individual ticket IDs/tokens per ticket (§7).

## 4. Payment flow (§4)

PAY NOW → `POST .../orders` (backend creates Razorpay order, `receipt = orderCode`) → Razorpay popup (UPI/cards/netbanking) → customer pays → **webhook** → backend verifies → tickets. Success-URL is never proof of payment.

## 5. Webhook (§5)

`POST /api/ticketing/webhook/razorpay`: verify signature with webhook secret → if order already PAID, ack + skip (**idempotent**) → atomic inventory decrement → create tickets → mark PAID → send email → (Phase 2: CAPI).

## 6. Order ID (§6)

Backend-generated `BE-RDB-2026-000001…` via atomic `Counter` (`$inc`), never from browser.

## 7. Ticket ID (§7)

Per-ticket `RDB-GEN-000001…` (per-tier counter) **plus** `secureToken` (crypto 32B hex, unique). QR/verify use the token, never the bare ID.

## 8. QR (§8)

QR content = `https://<host>/my-ticket/<secureToken>` only. QR PNG generated with `qrcode` lib at email time (dataURL embed) and client-side on ticket page (no QR storage needed).

## 9. Digital ticket (§9)

`/my-ticket/<token>`: brand, event, date/time/venue, category, holder, ticket ID, order ID, QR, entry status. Print-friendly CSS.

## 10. Email (§10)

`sendTicketConfirmation()` (SMTP-first, existing pattern): payment confirm, order ID, ticket list, QR images, event/venue/entry instructions, support contact. **Only from webhook after PAID.**

## 11. WhatsApp (§11) — Phase 2

Approved Business API provider TBD; reuse `WHATSAPP_PHONE_NUMBER` config. Ticket ID + event + ticket link.

## 12. My-ticket page (§12)

Token URLs are unguessable; page exposes holder name + ticket state only.

## 13–14. Admin dashboard + inventory (§13, §14)

`/admin/(dashboard)/ticketing/`: capacity 800, sold, remaining, orders, revenue, pending/paid/failed/refunded counts, checked-in; per-tier total/sold/remaining. Sidebar link added.

## 15. Oversell protection (§15)

Atomic `TicketTier.findOneAndUpdate({_id, soldQty: {$lte: totalQty - qty}}, {$inc: {soldQty: qty}})` inside webhook. Null result → no ticket, order FAILED → refund path. Frontend caps are cosmetic.

## 16. Statuses (§16)

Order: PENDING → PROCESSING → PAID | FAILED | CANCELLED | REFUNDED. Ticket: ACTIVE (only post-payment) | CHECKED_IN | CANCELLED | REFUNDED.

## 17–18. Check-in (§17, §18)

`/admin/(dashboard)/ticketing/checkin`: login + camera (`BarcodeDetector`) + manual token fallback → `POST /api/tickets/checkin` runs 6 checks (exists, valid token, paid, active, not used, same event) → GREEN “ENTRY APPROVED” + holder/category/ID, stamps time + staff; re-scan → “ALREADY USED + first check-in time”.

## 19. QR security (§19)

Token-only QRs, HTTPS, secure random tokens, no DB IDs, rate-limited verify, authenticated check-in.

## 20–21. Meta (§20, §21)

Phase 1: `MetaPixel.tsx` — PageView, ViewContent, AddToCart, InitiateCheckout, **Purchase only after API confirms PAID** (value, currency INR, order ID). Phase 2: server CAPI event post-webhook.

## 22. DB (§22)

`TicketTier`, `TicketOrder`, `Ticket`, `Counter` (+ optional `TicketCheckin` log); `Event` additive embed only. Mirrors spec shape, adapted to Mongoose patterns.

## 23–27. Admin ops (§23–27)

Manual REFUNDED (tickets → CANCELLED, QR dead); CSV export (order/ticket/customer/amount/status/check-in/timestamps); search (name/phone/email/order/ticket); manual complimentary ₹0 tickets (auto-PAID + QR); backend `maxPerOrder` (default 6).

## 28–29. Testing + launch (§28, §29)

Matrix: payment success/fail/cancel/duplicate-webhook/timeout; ticket ID/QR/category/price correctness; last-ticket race, simultaneous buyers, sold-out; valid/invalid/used/cancelled QR; email render + bad-email handling; Pixel event firing. Launch = spec checklist §29 verified + one live end-to-end ₹1 test purchase.

---

## File map

**New (~22):** `lib/models/{TicketTier,TicketOrder,Ticket,Counter}.ts`, `lib/services/ticketingService.ts`, `lib/utils/qr.ts`, `components/analytics/MetaPixel.tsx`, `components/ticketing/{TicketWidget,CheckoutPanel,TicketCard,CheckinScanner}.tsx`, `app/api/ticketing/events/[slug]/{quote,orders}/route.ts`, `app/api/ticketing/webhook/razorpay/route.ts`, `app/api/tickets/[token]/route.ts`, `app/api/tickets/checkin/route.ts`, `app/api/admin/ticketing/{dashboard,orders/[id],export}/route.ts`, `app/my-ticket/[token]/page.tsx`, `app/admin/(dashboard)/ticketing/{page,orders/page,checkin/page}.tsx`, `scripts/seed-rang-de-bhakti.mjs`.

**Modified (~7):** `lib/models/Event.ts` (additive), `lib/utils/email.ts` (+1 fn), `lib/utils/validators.ts` (+schemas), `app/events/[slug]/page.tsx` (widget slot), `components/admin/AdminSidebar.tsx` (link), `.env.example` (+6 vars), `docs/ProjectTree.md`.

**Untouched:** all other pages, RSVP registration flow, inquiries, auth, blog, import.

## Phase split
- **Phase 1:** §1–10, §12–19, §22–27 + browser Pixel (§20). WhatsApp/CAPI/auto-refund excluded.
- **Phase 2:** §11 WhatsApp, §21 CAPI, automatic gateway refunds, coupons/referrals.

## Estimates
Phase 1 ≈ 12–16 tasks (models → services → public APIs → webhook → pages → emails → admin → seed → test matrix → logs). Phase 2 ≈ 5 tasks.
