# Netlify environment variable checklist

Netlify has no on/off switch for variables. The only toggle is
**Contains secret values**, which hides the value in the UI/API/CLI.

## Turn ON "Contains secret values"

- `ADMIN_PASSWORD` (or preferably `ADMIN_PASSWORD_HASH` instead)
- `CEREBRAS_API_KEY` (not used in this repo; remove if not needed)
- `GOOGLE_CLIENT_SECRET`
- `IMAGEKIT_PRIVATE_KEY`
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API`
- `SMTP_APP_PASSWORD`
- `UPSTASH_REDIS_REST_TOKEN`
- `TURNSTILE_SECRET_KEY` (add when Turnstile is wired)
- `REDIS_URL` (only if used as the ioredis fallback; it contains a password)

## Keep OFF

- `ADMIN_EMAIL`, `EMAIL_TO`, `SMTP_FROM`, `SMTP_USER`
- `GOOGLE_CLIENT_ID`, `GOOGLE_REDIRECT_URI`
- `BING_SITE_VERIFICATION`, `GOOGLE_SITE_VERIFICATION`
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_URL_ENDPOINT`
- `MONGODB_DB_NAME`, `MONGODB_DB_COLLECTION_NAME`
- `NEXTAUTH_URL`
- `RAZORPAY_KEY_ID`
- All `NEXT_PUBLIC_*` values, including `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- Cache prefixes/TTLs (`AUTH_*`, `HOME_DATA_*`, `REVIEWS_*`, `USER_*`, `REDIS_CACHE_KEY_PREFIX`)
- `WHATSAPP_PHONE_NUMBER`, `TICKETING_QR_BASE_URL`

`NEXT_PUBLIC_*` values are embedded in the browser bundle. Marking them secret
does not protect them and can only cause confusion.

## Add for Turnstile

| Key | Secret? | Scope |
| --- | --- | --- |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No | All contexts |
| `TURNSTILE_SECRET_KEY` | Yes | All contexts |

## Optional / already defaulted

- `ADMIN_PASSWORD_HASH` — preferred over the plain `ADMIN_PASSWORD`.
- `MONGODB_DB_APPLICANTS_COLLECTION_NAME`, `MONGODB_MAX_POOL_SIZE` — defaults exist.
- `SMTP_HOST`, `SMTP_PORT`, `RESEND_FROM` — defaults/optional.
- `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID` — optional analytics.
- `CEREBRAS_API_KEY` — not referenced by this repository.
- `REDIS_URL` — only for the ioredis fallback; Upstash REST is used by default.
