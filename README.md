# BlueEye

Modern artist discovery and booking platform built with Next.js 14.

## Stack

- Next.js 14
- TypeScript
- MongoDB
- Mongoose
- TailwindCSS
- NextAuth
- ImageKit

## Features

- Artist discovery
- Artist profiles
- Search and filters
- Category and city pages
- Booking inquiries
- Admin dashboard
- JSON bulk import

## Development

```bash
npm install
npm run dev
````

Open:

```txt
http://localhost:3000
```

## Documentation

Project documentation lives inside:

```txt
docs/          — core docs (SRS, AI context, logs, tree)
.agents/       — agent context & rules
SKILL.md       — agent skill definition
DESIGN.md      — architecture & design decisions
AGENTS.md      — AI agent instructions
```

Important files:

* `AGENTS.md` — agent instructions
* `SKILL.md` — agent skill for this project
* `DESIGN.md` — architecture & design decisions
* `docs/AI_CONTEXT.md` — full AI context
* `docs/ProjectSRS.md` — requirements & schemas
* `docs/ProjectLog.md` — current status
* `docs/ProjectTree.md` — file structure
* `docs/CLOUDFLARE_TURNSTILE_SETUP.md` — Cloudflare DNS/proxy, WAF, cache, Turnstile

## Admin Access

For development and testing, ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in your `.env.local` file.

Admin panel can be accessed at `/admin` or via the Navbar when logged in.

## Backup & Restore

Backup the database:

```bash
mongodump --uri="YOUR_MONGODB_URI" --db BlueEyeEntertainment --out backup
```

Restore the database from a backup:

```bash
mongorestore --uri="YOUR_MONGODB_URI" --db BlueEyeEntertainment C:\MongoBackups\BlueEyeEntertainment
```
