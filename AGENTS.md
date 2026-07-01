<!-- BEGIN:nextjs-agent-rules -->
<!-- # This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.

Read the relevant guide in `node_modules/next/dist/docs/` before writing any code.

Heed deprecation notices. -->
<!-- END:nextjs-agent-rules -->

# Agent Instructions

Before making any changes, read these in order:

1. `.agents/context.md` — quick project overview
2. `.agents/rules.md` — project rules
3. `docs/AI_CONTEXT.md` — full AI instructions
4. `docs/ProjectSRS.md` — architecture, routes, schemas
5. `docs/ProjectTree.md` — current project structure
6. `docs/ProjectLog.md` — current status & decisions

Then follow the instructions defined in `docs/AI_CONTEXT.md`.

# Design Reference

Before implementing UI changes, read `DESIGN.md` for architecture decisions and `SKILL.md` for the project skill definition.

# Commit workflow

Before committing, run `npm run build` to verify the build passes.
If it fails, fix the issue before committing.
