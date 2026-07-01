# BlueEye — Dev Commands

## Development
```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Type-check & build (run before every commit)
npm run start        # Start production build locally
npm run lint         # ESLint check
```

## Database
```bash
# MongoDB connection string in .env.local:
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/...
```

## Auth
- Admin credentials in `.env.local`: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`
- Login at `/admin/login`

## Build Verification
```bash
npm run build        # Must pass before commit
```
