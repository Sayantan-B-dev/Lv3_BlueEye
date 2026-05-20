# AI Context

This repository is developed using multiple AI agents, IDEs, accounts, devices, and contributors.

Before making any change, read the project documents in the exact order below.

---

# Required Reading Order

1. `ProjectDemo.html`
   - Primary UI and visual source of truth.
   - Follow layout, spacing, responsiveness, component structure, and interaction patterns.

2. `ProjectPlan.md`
   - Contains current progress, completed tasks, and remaining work.
   - Continue from the next unfinished task whenever possible.

3. `ProjectSRS.md`
   - Highest source of truth for architecture, routes, schemas, APIs, rendering strategy, and product scope.
   - Never invent features outside the SRS.

4. `ProjectTree.md`
   - Contains latest known project structure.
   - Check before creating, moving, renaming, or deleting files.

5. `ProjectLog.md`
   - Contains latest project state, major decisions, current priorities, and architecture notes.

6. `logs/YYYY-MM.md`
   - Contains detailed chronological development logs and file-level changes.

---

# SRS Priority Rule

If assumptions conflict with implementation details:
- follow `ProjectSRS.md`

Do not override SRS decisions unless explicitly updated inside:
- `ProjectPlan.md`
- `ProjectLog.md`

---

# Context Efficiency Rules

- Prefer reading only relevant files instead of the entire repository.
- Prefer compact logs and summaries over long explanations.
- Avoid rewriting large files unnecessarily.
- Avoid repeating already-established architecture decisions.
- Use existing patterns before creating new abstractions.
- Keep edits localized and incremental.
- Read only required sections of the SRS whenever possible.
- Prefer extending existing components instead of generating replacements.
- Minimize unnecessary planning and analysis token usage.

---

# Memory Rules

Project memory priority:

1. Current task files
2. `ProjectLog.md`
3. Current monthly log
4. Relevant SRS sections
5. Remaining docs only if necessary

Avoid loading unnecessary context.

---

# Core Development Rules

- Follow `ProjectDemo.html` strictly for frontend implementation.
- Keep UI clean, responsive, reusable, and visually consistent.
- Prefer reusable components over duplicated code.
- Keep components modular and isolated.
- Keep business logic outside UI components whenever possible.
- Keep admin functionality separated from public functionality.
- Maintain predictable folder organization.
- Prefer simple architecture over unnecessary abstraction.
- Prefer readability over cleverness.
- Prefer incremental improvements over massive rewrites.
- Maintain exact schema compatibility across frontend and backend.
- Maintain consistent naming conventions across the project.
- Maintain scalable but low-complexity architecture decisions.

---

# Documentation Rules

After completing work:

- Update `ProjectLog.md` for important project-level updates.
- Update `logs/YYYY-MM.md` for detailed chronological changes.
- Update `ProjectPlan.md` when tasks are completed.
- Update `ProjectTree.md` after major structure changes.

If the current monthly log does not exist:
- create `logs/YYYY-MM.md`

---

# Logging Rules

For every completed task:

- Record changed files.
- Record major decisions.
- Record installed dependencies.
- Record terminal commands used.
- Record migrations, generators, and scripts executed.
- Record environment variable additions or changes.
- Record database/schema changes.
- Record route additions or deletions.

Keep logs compact and chronological.

---

# Command Logging Format

Use compact command logs.

Example:

```bash
npm install mongoose next-auth zod
npx shadcn-ui@latest init
npm run dev
````

---

# File Change Format

* `app/page.tsx` => rebuilt homepage hero
* `lib/db/connect.ts` => added mongoose singleton
* `app/api/search/route.ts` => added search endpoint

---

# Dependency Change Format

* added `mongoose`
* added `next-auth`
* removed `axios`

---

# Environment Change Format

* added `MONGODB_URI`
* added `NEXTAUTH_SECRET`
* updated `IMAGEKIT_URL_ENDPOINT`

---

# Monthly Log Structure

Recommended structure for `logs/YYYY-MM.md`:

````md
# 2026-05

## 2026-05-09

### Completed
- Added artist schema
- Added inquiry schema

### Files
- `lib/models/Artist.ts` => created schema
- `lib/models/Inquiry.ts` => created schema

### Commands

```bash
npm install mongoose
npm install zod
````

### Notes

* MongoDB singleton implemented
* Search indexes added

```

Avoid long explanations unless necessary for future debugging.

---

# Architecture Rules

Frontend:
- Next.js App Router
- TypeScript
- TailwindCSS
- shadcn/ui only as implementation utility

Backend:
- Next.js Route Handlers
- MongoDB
- Mongoose

Authentication:
- NextAuth
- Single admin system

Media:
- ImageKit CDN

State/Data:
- SWR or lightweight fetching
- Avoid heavy global state initially

---

# Database Rules

Primary models:
- Artist
- Inquiry

Optional:
- Admin

Do not create unnecessary models unless explicitly required.

Avoid creating:
- Category model
- City model
- Genre model
- Language model

Use schema structure defined inside `ProjectSRS.md`.

---

# Architecture Stability Rule

Do not introduce:
- Redux
- Zustand
- Prisma
- Drizzle
- GraphQL
- Microservices
- tRPC
- Complex caching systems

unless explicitly required inside `ProjectPlan.md`.

---

# File Creation Rules

Before creating new files:

1. Check if similar functionality already exists.
2. Check `ProjectTree.md`.
3. Prefer extending existing systems instead of duplicating logic.
4. Avoid unnecessary wrappers and abstractions.

---

# Refactor Rules

Do not perform large refactors unless:
- required for maintainability
- required for scalability
- required for architecture consistency
- explicitly planned in `ProjectPlan.md`

Avoid changing stable APIs unnecessarily.

---

# UI Rules

- Match `ProjectDemo.html` as closely as possible.
- **Styling Architecture**: Use modular CSS files in `styles/components/` (e.g., `pages.css`, `base.css`) instead of Tailwind utility classes that rely on missing theme config (like `bg-surface/30` or `border-border/40`).
- **CSS Variables**: Rely heavily on the project's predefined CSS variables (`var(--surface)`, `var(--gold)`, `var(--border)`, `var(--text)`) via inline styles or custom class names.
- **Icons**: NEVER use emojis. Always use high-quality SVG icons to maintain a premium look.
- Maintain spacing consistency.
- Maintain responsive behavior.
- Avoid inconsistent component styling.
- Avoid random design systems.
- Keep animations subtle and lightweight.
- Prefer clean layouts over visually heavy sections.

---

# Performance Rules

- Prefer server components where appropriate.
- Avoid unnecessary client components.
- Avoid unnecessary re-renders.
- Optimize image loading.
- Keep bundle size reasonable.
- Use ISR and caching strategies defined in the SRS.

---

# SEO Rules

Follow metadata strategy defined in `ProjectSRS.md`.

Public pages should maintain:
- proper metadata
- canonical URLs
- OpenGraph support
- clean routing structure

---

# Import Rules

Prefer:
- absolute imports
- modular imports
- predictable folder paths

Avoid:
- deeply nested relative imports
- circular dependencies

---

# Execution Rules

- Do not explain obvious code changes unless requested.
- Do not restate existing architecture decisions.
- Do not generate large summaries after small edits.
- Avoid repeating previously established context.
- Avoid scanning unrelated directories.
- Avoid opening large files unless necessary.
- Avoid generating duplicate utilities or wrappers.
- Prefer editing existing files over creating new ones.
- Prefer targeted patches over full-file rewrites.

---

# Planning Rules

Before implementing:

1. Identify the smallest valid change.
2. Reuse existing patterns whenever possible.
3. Avoid speculative architecture.
4. Avoid future-proofing beyond MVP scope.
5. Stay within current phase from `ProjectPlan.md`.

Do not redesign stable systems unnecessarily.

---

# File Reading Rules

Read files in this priority order:

1. Current task files
2. Direct dependencies/imports
3. Relevant SRS section
4. Relevant logs
5. Remaining project files only if required

Avoid repository-wide scanning unless explicitly necessary.

---

# Response Rules

Keep responses:
- compact
- implementation-focused
- low-noise
- low-redundancy

Prefer:
- direct edits
- concise reasoning
- actionable outputs

Avoid:
- motivational text
- repeated summaries
- unnecessary explanations
- verbose planning

---

# Component Rules

Before creating a new component:

- check existing components first
- extend reusable UI where possible
- avoid one-time wrapper components
- avoid deeply nested abstractions

Keep component hierarchy shallow and predictable.

---

# API Rules

- Reuse existing service patterns.
- Keep API responses consistent.
- Avoid creating unnecessary endpoints.
- Prefer extending filters over duplicating APIs.
- Keep validation centralized.

---

# Dependency Rules

Before adding dependencies:

1. Check if existing stack already solves the problem.
2. Prefer native Next.js or React solutions.
3. Avoid dependencies for small utilities.
4. Avoid overlapping libraries.

Minimize dependency growth.

---

# Final Rule

This project may be edited over long periods of time by different AI systems and contributors.

Always prioritize:
- consistency
- maintainability
- predictability
- scalability
- low complexity
- low token usage
- minimal confusion for future agents
