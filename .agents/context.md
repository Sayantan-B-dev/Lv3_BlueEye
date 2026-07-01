# BlueEye — Quick Context

BlueEye is a Next.js 14 MVP for discovering and booking Indian performing artists.

## Key Docs (read in order)
1. `docs/AI_CONTEXT.md` — AI agent instructions
2. `docs/ProjectSRS.md` — full SRS (architecture, routes, schemas)
3. `docs/ProjectTree.md` — project file structure
4. `docs/ProjectLog.md` — current status & decisions
5. `docs/ProjectDB.md` — detailed DB schema
6. `docs/logs/2026-05.md` — recent dev log

## Current Phase
Phase 5 — Final Polish + Security Hardening

## MVP Status
All core features complete (artist CRUD, search, filters, inquiry flow, admin dashboard, JSON import). Remaining: ISR/SSR config, image optimization, FAQ section, loading states, production deployment.

## Critical Rules
- Only 3 Mongoose models: Artist, Inquiry, Admin
- No Redux/Zustand/Prisma/Drizzle/GraphQL/tRPC
- UI matches ProjectDemo.html
- SVG icons only (no emojis)
