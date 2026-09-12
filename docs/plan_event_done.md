# Event Ticketing — Done (branch `feat/event-ticketing`)

Paid ticketing for events (built for **Rang De Bhakti**, 800 capacity). Guest checkout, Razorpay, QR entry. Existing pages/flows untouched — event page only gains a ticket card when admin enables ticketing.

## Buy flow
1. `/events/rang-de-bhakti` → Book Tickets card (categories, qty stepper, live server-priced quote with fee/GST/total).
2. Buyer enters name + email + phone (+ optional DOB/city) → PAY NOW → Razorpay popup (UPI/cards/netbanking).
3. Webhook verifies payment → atomic inventory decrement → minted tickets (`BE-RDB-2026-000001` orders, `RDB-VIP-000125` tickets + secure tokens) → confirmation email with QR codes.
4. Buyer polls to `/my-ticket/<token>` digital tickets; email has the same links.

## Entry
- QR = `…/my-ticket/<secure-token>` only (no IDs inside).
- `/admin/ticketing/checkin`: camera scanner + manual entry; ENTRY APPROVED vs ALREADY USED (+ first check-in time); dead for refunded/cancelled.

## Admin (`/admin/ticketing`)
- Dashboard: capacity/sold/remaining, revenue, order statuses, checked-in, per-tier inventory.
- Orders: search (name/phone/email/order/ticket), manual refund (tickets die, stock returns; gateway refund manual), comp ₹0 tickets with real QRs, CSV export.
- Tiers + fees/GST/limits + page content (highlights/terms/refund/contact) via API; event create stays in `/admin/events`.

## Safety
Server-only pricing · webhook-before-tickets (success URL proves nothing) · idempotent webhook · atomic `$expr` inventory guard · backend max 6/order · rate-limited verify · admin-only check-in · email only after PAID.

## To go live
1. `RAZORPAY_KEY_ID/SECRET` in env (no webhook URL needed — confirm endpoint verifies HMAC + captured status server-side).
2. Create event in admin, run `scripts/seed-rang-de-bhakti.mjs` (or tier/config APIs).
3. ₹1 test purchase → check email, QR scan, duplicate scan, refund.
4. Phase 2 (not built): WhatsApp, Meta CAPI, auto-refunds, coupons.

Full spec traceability: `docs/plan_event.md` (§1–§29).
