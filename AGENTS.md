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

The project owner runs `npm run build` manually. Do **not** run it unless the
owner explicitly asks; verify with `npx tsc --noEmit`, lint, and dev smoke tests
instead.

## Git and Commit Rules

### Setup
- Initialize Git locally at the start with `git init` if the repository is not already a Git repository.
- Maintain a thorough `.gitignore` covering `node_modules`, `.next`, `out`, `build`, `dist`, `coverage`, environment files (except `.env.example`), logs, OS files, editor folders, caches, `*.tsbuildinfo`, Playwright reports, and temporary files.
- **Do not add a Git remote, push, publish, or deploy unless the owner explicitly asks.** Do not suggest pushing as part of the normal workflow.

### Initial Commit Sequence
1. **Commit 1:** Boilerplate only.
2. **Commit 2:** Documentation, including `README.md`, `docs/`, `agent.md`, `DESIGN.md`, and the relevant skill file.
3. **Commit 3:** Additional configuration, scripts, mock data scaffolding, CI files, and editor configuration.
4. **Commit 4 onward:** One commit per completed feature, following the project's build order.

Adapt this sequence to the repository's actual Git history. Do not recreate or force the initial commit sequence in an existing repository.

### When to Commit
- Commit **only after the owner confirms** that the feature works, unless the owner explicitly instructs the agent to commit.
- One commit must represent one complete, verified feature. Do not commit half-built or knowingly broken work.
- Do not commit tiny or unrelated changes individually. Group related changes into a meaningful commit or ask the owner whether to commit them.
- **Exception:** If the owner explicitly instructs the agent to commit, including for a small fix or documentation change, commit as instructed after completing the required verification.
- Before requesting confirmation, run the applicable lint checks, TypeScript type-check, and relevant tests. The owner runs the production build.

### Mandatory Pre-Commit Verification
The owner performs `npm run build` manually. Do **not** run it; ask the owner to confirm the production build passed before committing.

Follow this sequence:

1. Review the changes with `git status` and inspect the relevant diff.
2. Run the project's applicable lint command.
3. Run the TypeScript type-check command, if configured.
4. Run relevant unit and integration tests.
5. Confirm with the owner that `npm run build` succeeded after the changes.
6. Resolve any failures caused by the changes and repeat the relevant checks.
7. Review the final diff and ensure no secrets, generated artifacts, unrelated changes, or unintended files are included.
8. Stage only the intended files and create the commit when authorized.

Additional requirements:
- Read `package.json` to identify the actual scripts before running project checks. Do not assume that lint, type-check, or test scripts exist.
- If a required check is unavailable or cannot run, report the limitation explicitly. Never claim