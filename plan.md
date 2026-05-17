# Event Management System — Implementation Plan

## Overview

Add a full **Event Management** module to the platform. Events are created and
managed by the admin, publicly visible to all users, and users can
**RSVP / request participation**. Each event has a live
**timeline/thread UI** — admin posts chronological status updates (like a Jira
issue thread). Users get notified via **Resend email** AND **WhatsApp** when
their registration status changes.

---

## Architecture

```
Event (admin creates)
  └─ EventUpdates  (admin posts timeline/thread updates)
  └─ EventRegistrations (users submit booking requests)
       └─ status: Pending → Approved / Rejected / Waitlisted
       └─ triggers Email + WhatsApp notification on status change
```

---

## Open Questions (answer before execution starts)

> **Q1 — WhatsApp Provider**
>
> | Option | Setup | Cost | Notes |
> |--------|-------|------|-------|
> | Meta WhatsApp Cloud API | ~30 min (needs Meta Business account + phone) | Free (1000 conv/month) | Production-grade |
> | CallMeBot | ~2 min (WhatsApp a bot, get API key) | Free forever | Personal/testing |
>
> Default plan below uses **Meta Cloud API** with graceful fallback if env vars
> not set (logs warning, does not crash). Can swap to CallMeBot by changing one
> function.

> **Q2 — Participation Model**
>
> Planned: **Booking Request with Approval flow**
> - User fills form (name, phone, headcount, message)
> - Admin approves or rejects
> - User gets Email + WhatsApp notification
>
> Alternative: Simple RSVP (no approval, just add to guest list).

---

## Phase 1 — Database Models

### `lib/models/Event.ts` [NEW]

```ts
{
  title: String             // required
  slug: String              // unique, auto-generated from title
  description: String       // markdown/plain text, rich body
  shortDescription: String  // one-liner for cards
  category: String          // 'Concert' | 'Corporate' | 'Festival' | 'Wedding Show' | 'Other'
  venue: {
    name: String
    city: String
    state: String
    address: String
  }
  startDate: Date           // required
  endDate: Date             // optional
  coverImage: String        // ImageKit URL
  artists: [ObjectId]       // ref: Artist — optional linked artist lineup
  status: String            // 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled'
  featured: Boolean         // show on home page
  capacity: Number          // 0 = unlimited
  registrationOpen: Boolean // toggle registration on/off
  tags: [String]
  // timestamps: true
}
```

### `lib/models/EventUpdate.ts` [NEW] — the "thread" posts

```ts
{
  eventId: ObjectId   // ref: Event, required
  content: String     // the update body text, required
  type: String        // 'Info' | 'Alert' | 'Milestone' | 'Media'
  attachments: [String] // ImageKit URLs (optional)
  postedBy: String    // admin display name
  // timestamps: true (createdAt used for ordering)
}
```

### `lib/models/EventRegistration.ts` [NEW]

```ts
{
  eventId: ObjectId   // ref: Event, required
  userId: ObjectId    // ref: User, optional (guest registrations allowed)
  guestName: String   // required
  guestEmail: String  // required
  guestPhone: String  // required (used for WhatsApp)
  headcount: Number   // default 1
  message: String     // optional note from user
  status: String      // 'Pending' | 'Approved' | 'Rejected' | 'Waitlisted'
  whatsappSent: Boolean
  emailSent: Boolean
  adminNotes: String  // internal admin note
  // timestamps: true
}
```

---

## Phase 2 — Services

### `lib/services/eventService.ts` [NEW]
- `getEvents(params)` — paginated list with filter: status, category, featured
- `getEventBySlug(slug)` — single event + its updates array
- `createEvent(data)` — admin
- `updateEvent(id, data)` — admin
- `deleteEvent(id)` — admin
- `getEventStats()` — counts by status for admin dashboard

### `lib/services/eventRegistrationService.ts` [NEW]
- `registerForEvent(data)` — public submission (status = Pending)
- `updateRegistrationStatus(id, status, adminNotes?)` — admin, triggers notifications
- `getRegistrationsByEvent(eventId)` — admin
- `getRegistrationByUser(userId)` — user's own registrations

### `lib/utils/whatsapp.ts` [NEW]
- `sendWhatsAppMessage(phone, message)` — wraps Meta Cloud API
- Graceful no-op if `WHATSAPP_API_TOKEN` is not set

### `lib/utils/email.ts` [EXTEND]
Add three new functions:
- `sendEventRegistrationConfirmation(data)` — on submit (Pending)
- `sendEventRegistrationApproved(data)` — on admin approval
- `sendEventRegistrationRejected(data)` — on admin rejection

---

## Phase 3 — API Routes

### Public API

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/events` | List events. Query: `status`, `category`, `featured`, `page` |
| GET | `/api/events/[slug]` | Single event + updates thread |
| POST | `/api/events/[slug]/register` | Submit registration (public) |

### Admin API (session-protected)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/events` | All events |
| POST | `/api/admin/events` | Create event |
| PUT | `/api/admin/events/[id]` | Update event fields |
| DELETE | `/api/admin/events/[id]` | Delete event |
| POST | `/api/admin/events/[id]/updates` | Post a thread update |
| DELETE | `/api/admin/events/[id]/updates/[uid]` | Delete a thread update |
| GET | `/api/admin/events/[id]/registrations` | All registrations for event |
| PUT | `/api/admin/events/[id]/registrations/[rid]` | Approve / Reject / Waitlist |

---

## Phase 4 — Frontend Pages

### Public Pages

#### `app/events/page.tsx` [NEW] — Events Listing
- Matches site design system (same spacing, cards, CSS vars as rest of site)
- Card grid: cover image, title, date, venue city, status badge, artist count
- Filter bar: status tabs (All / Upcoming / Ongoing / Completed)
- Empty state if no events

#### `app/events/[slug]/page.tsx` [NEW] — Event Detail (Thread UI)
Layout: 2-column on desktop, stacked on mobile

**Left / Main column:**
- Hero: cover image, title, date, venue, status badge, linked artists
- **Timeline Thread** — vertical list of `EventUpdate` posts
  - Each post: type icon + badge, timestamp, content, optional image attachments
  - Types styled differently: Milestone (gold), Alert (red), Info (blue), Media (grey)
  - Newest updates at top (or chronological — configurable)

**Right / Sidebar:**
- Event info card: date, venue address, capacity, spots remaining
- **Registration Form** (shown when `registrationOpen = true` and status ≠ Completed/Cancelled)
  - Fields: name, email, phone, headcount (number), message
  - Success state: "Your request is pending. You'll be notified by email and WhatsApp."
- If user already registered: show their current status pill

#### `app/events/[slug]/my-registration/page.tsx` [NEW] — User's Registration Status
- Protected (must be logged in or use token link)
- Shows status, admin notes, event details

### Admin Pages

#### `app/admin/(dashboard)/events/page.tsx` [NEW]
- Table: title, category, date, status, registrations count, actions (edit/delete)
- "New Event" button

#### `app/admin/(dashboard)/events/new/page.tsx` [NEW]
- Full event creation form

#### `app/admin/(dashboard)/events/[id]/page.tsx` [NEW]
Three tabs:
1. **Details** — edit event form
2. **Thread** — post/delete EventUpdates (live timeline management)
3. **Registrations** — table of all registrations with Approve/Reject/Waitlist actions

---

## Phase 5 — Components

### Public Components
- `components/events/EventCard.tsx` — card for listing page
- `components/events/EventTimeline.tsx` — vertical thread of updates
- `components/events/EventTimelinePost.tsx` — single update item
- `components/events/EventRegistrationForm.tsx` — public form
- `components/events/EventStatusBadge.tsx` — colored status pill
- `components/events/EventHero.tsx` — event detail hero section

### Admin Components
- `components/admin/EventForm.tsx` — create/edit event
- `components/admin/EventUpdateForm.tsx` — post a thread update
- `components/admin/RegistrationTable.tsx` — manage registrations

---

## Phase 6 — Navigation Update

### `components/layout/Navbar.tsx` [MODIFY]
- Add **Events** nav link between Artists and Contact

---

## Phase 7 — Notifications

### Email (Resend — existing strategy)
Three new templates added to `lib/utils/email.ts`:

```
sendEventRegistrationConfirmation — subject: "Your registration for {event} is received"
sendEventRegistrationApproved     — subject: "You're confirmed for {event}! 🎉"
sendEventRegistrationRejected     — subject: "Update on your registration for {event}"
```

### WhatsApp (Meta Cloud API — new)

`lib/utils/whatsapp.ts`:
```ts
export async function sendWhatsAppMessage(phone: string, message: string) {
  // POST to https://graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages
  // Uses WHATSAPP_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID env vars
  // Graceful no-op if vars not set
}
```

Messages sent on:
- Registration submitted → "Hi {name}, your request for {event} is received. We'll notify you soon."
- Approved → "🎉 Great news! Your spot at {event} on {date} is confirmed."
- Rejected → "Hi {name}, unfortunately your request for {event} could not be accommodated."

---

## Phase 8 — Environment Variables

Add to `.env.local` and `.env.example`:

```bash
# WhatsApp (Meta Cloud API)
WHATSAPP_API_TOKEN=your_meta_permanent_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_NUMBER=+91XXXXXXXXXX
```

---

## File Summary

### New Files
```
lib/models/Event.ts
lib/models/EventUpdate.ts
lib/models/EventRegistration.ts
lib/services/eventService.ts
lib/services/eventRegistrationService.ts
lib/utils/whatsapp.ts
app/api/events/route.ts
app/api/events/[slug]/route.ts
app/api/events/[slug]/register/route.ts
app/api/admin/events/route.ts
app/api/admin/events/[id]/route.ts
app/api/admin/events/[id]/updates/route.ts
app/api/admin/events/[id]/updates/[uid]/route.ts
app/api/admin/events/[id]/registrations/route.ts
app/api/admin/events/[id]/registrations/[rid]/route.ts
app/events/page.tsx
app/events/[slug]/page.tsx
components/events/EventCard.tsx
components/events/EventTimeline.tsx
components/events/EventTimelinePost.tsx
components/events/EventRegistrationForm.tsx
components/events/EventStatusBadge.tsx
components/events/EventHero.tsx
components/admin/EventForm.tsx
components/admin/EventUpdateForm.tsx
components/admin/RegistrationTable.tsx
app/admin/(dashboard)/events/page.tsx
app/admin/(dashboard)/events/new/page.tsx
app/admin/(dashboard)/events/[id]/page.tsx
```

### Modified Files
```
lib/utils/email.ts          — add 3 new email functions
lib/utils/whatsapp.ts       — new WhatsApp util
components/layout/Navbar.tsx — add Events link
.env.local                  — add WhatsApp vars
.env.example                — add WhatsApp vars
docs/ProjectTree.md         — update structure
docs/logs/2026-05.md        — log changes
```

---

## Execution Order

1. Models (`Event`, `EventUpdate`, `EventRegistration`)
2. Services (`eventService`, `eventRegistrationService`)
3. Notification utils (`whatsapp.ts`, extend `email.ts`)
4. API routes (public then admin)
5. Components (shared first, then page-specific)
6. Pages (public listing → public detail → admin pages)
7. Navbar update
8. `.env` updates
9. Build verification

---

## Verification

```bash
cmd.exe /c "npm run build"   # must exit 0
```

Manual test flow:
1. Admin creates event → posts 2-3 thread updates
2. Public visits `/events` → event card appears
3. Public visits `/events/[slug]` → timeline renders, form visible
4. User submits registration → email + WhatsApp sent
5. Admin approves → user gets approval email + WhatsApp
6. Admin cancels event → status badge updates
