# BlueEye — Design & Architecture

## Project Purpose
BlueEye is a booking inquiry platform for Indian performing artists (singers, bands, comedians, dancers, DJs). MVP focuses on artist discovery → profile view → inquiry submission → admin management.

## Architecture Overview

```
User (Browser)  →  Next.js App Router  →  API Routes  →  MongoDB
                        │                        │
                   Server Components          Services Layer
                   Client Components          Mongoose Models
```

**Rendering strategy:**
- ISR (1hr revalidation) for home, artist profiles, category/city pages
- SSR for browse/search pages (dynamic filters/pagination)
- Client components only where interactivity is needed (forms, modals, filters)

## Key Design Decisions

### Why Mongoose over Prisma/Drizzle
- Schema already defined and stable
- Pre-save hooks needed for search field generation
- Flexible schema for artist data from external sources
- Direct MongoDB text search indexes

### Why NextAuth over custom auth
- Built-in session management, CSRF protection
- JWT strategy for stateless auth
- Easy middleware integration for route protection
- Single admin is an edge case it handles well

### Why ImageKit over self-hosted images
- Built-in CDN with global edge
- On-the-fly transformations (resize, format conversion)
- No server-side image processing load
- Simple URL-based API

### Why no global state management
- MVP scope doesn't warrant it
- SWR handles server state caching and revalidation
- Avoids unnecessary complexity and bundle size

### Why string fields for category/city/genre/language
- Data comes from external scraping — values are unpredictable
- Separate models would require constant sync/migration
- Simple string queries with lowercased search fields are sufficient for MVP

## Data Flow

### Public flow
```
Browse artists → /artists (SSR) → GET /api/artists → artistService.getArtists()
View profile  → /artists/[slug] (ISR) → GET /api/artists/[slug] → artistService.getArtistBySlug()
Search        → /search?q= (SSR) → GET /api/search → searchService.searchArtists()
Inquiry       → InquiryForm (client) → POST /api/inquiries → inquiryService.createInquiry()
```

### Admin flow
```
Login    → /admin/login → NextAuth credentials provider
Dashboard → /admin → GET /api/admin/dashboard → stats
Artists  → /admin/artists (CRUD) → admin artist APIs
Inquiries → /admin/inquiries (list/update) → admin inquiry APIs
Import   → /admin/import → POST /api/admin/artists (bulk) → importService
```

## Component Architecture

```
Layout:
  Navbar (client: mobile menu toggle)
  Footer
  AdminSidebar (client: navigation)

Pages → Server Components (data fetching) → Client Components (interactivity)

ArtistCard (shared) ← used in grids, search results, admin tables
```

## Model Relationships

```
Artist ──< Inquiry
  │          │
  │          └── references artistId (ObjectId), artistName (denormalized)
  │
  └── embedded subdocuments: source, location, performance, booking, faq, media, search
```

## CSS/Styling Approach

- CSS variables for theming: `--surface`, `--gold`, `--border`, `--text`
- Modular CSS files in `styles/components/` (e.g., `pages.css`, `base.css`)
- Tailwind only where CSS variables aren't needed
- No CSS-in-JS libraries
- responsive breakpoints follow the demo design

## Search Implementation

- MongoDB `$text` index on `name`, `about`, `category`
- Lowercased helper fields in `search` subdocument for filtering
- Pre-save hook auto-generates search fields
- Debounced client search with SWR

## Security Model

- Admin routes protected by NextAuth middleware
- Admin credentials from environment variables (not DB)
- API routes check session role === 'admin'
- Zod validation on all mutation endpoints
- ImageKit private key never exposed to client
