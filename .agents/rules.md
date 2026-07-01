# BlueEye — Project Rules (Distilled)

## Stack
- Next.js App Router + TypeScript
- MongoDB + Mongoose
- NextAuth (admin-only, credentials)
- TailwindCSS + shadcn/ui
- ImageKit CDN

## Models (ONLY these)
- `Artist`, `Inquiry`, `Admin` (optional single-doc)
- NO Category, City, Genre, Language models — use string fields

## API
- Public: `/api/artists`, `/api/search`, `/api/filters`, `/api/inquiries` (POST)
- Admin: `/api/admin/*` (protected), `/api/inquiries` (GET)
- Auth: NextAuth credentials, middleware protects `/admin/*`

## UI
- Match `docs/ProjectDemo.html` exactly (if exists)
- CSS variables: `var(--surface)`, `var(--gold)`, `var(--border)`, `var(--text)`
- NEVER use emojis — use SVG icons
- Modular CSS in `styles/components/`

## Frontend
- Prefer Server Components by default
- Client Components only when necessary (interactivity, hooks)
- Use SWR for client data fetching
- `generateMetadata` for SEO on all public pages

## Documentation
After changes, update:
- `docs/ProjectLog.md` — project-level updates
- `docs/logs/YYYY-MM.md` — detailed chronological changes
- `docs/ProjectTree.md` — after major file structure changes

## Commit
- Always run `npm run build` before committing
- Keep commits focused and atomic
