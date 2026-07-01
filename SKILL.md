# BlueEye — Agent Skill

## Description
Skill for working on the BlueEye Indian Artists Booking Platform — a Next.js 14 MVP with MongoDB, NextAuth, and ImageKit.

## When to load this skill
Load when the task involves any BlueEye project code: frontend, backend, admin dashboard, API routes, models, services, or documentation.

## Prerequisite reading order
1. `.agents/context.md` — 30-second project overview
2. `.agents/rules.md` — distilled do/don't rules
3. `docs/AI_CONTEXT.md` — full AI agent instructions
4. `docs/ProjectSRS.md` — SRS (architecture, routes, schemas, models)
5. `docs/DESIGN.md` — design decisions and rationale
6. `docs/ProjectTree.md` — file structure reference
7. `docs/ProjectLog.md` — current project state
8. `docs/ProjectDB.md` — detailed database schema

## Stack
| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js (Credentials, admin-only) |
| Styling | Tailwind CSS + shadcn/ui (match demo) |
| Images | ImageKit CDN |
| State | SWR (lightweight) |
| Validation | Zod |

## Key architecture decisions
- **3 models only**: Artist, Inquiry, Admin (optional single-doc)
- **No ORM**: Mongoose ODM directly
- **No global state**: SWR for client fetching
- **No category/city/genre/language models**: stored as string fields
- **ISR + SSR**: ISR for static pages (1hr), SSR for dynamic listings
- **Admin panel**: separated from public routes, protected by middleware

## Core file locations
- `app/` — routes and pages (App Router)
- `components/` — React components (layout/, artists/, admin/, ui/, home/)
- `lib/` — backend (models/, services/, auth/, db/, utils/)
- `types/` — TypeScript interfaces
- `styles/` — CSS files
- `docs/` — documentation
- `.agents/` — agent context & rules

## Common tasks
- New page: create route in `app/`, component in `components/`
- New API: create route in `app/api/`, service in `lib/services/`
- New model: add to `lib/models/`, service to `lib/services/`
- UI changes: match `DESIGN.md` conventions, use CSS variables, SVG icons only

## Verification
Always run `npm run build` before committing. Fix any TypeScript or ESLint errors.
