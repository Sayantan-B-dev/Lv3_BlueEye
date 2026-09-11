# Gmail SMTP Setup for OTP Emails (Free, No Domain Needed)

Why this exists: Resend's free sandbox sender (`onboarding@resend.dev`) can ONLY
deliver to the Resend account owner's inbox. `lib/utils/email.ts` therefore
redirects all user OTPs to `EMAIL_TO`. Gmail SMTP sends directly to the real user
(e.g. `virus404beats@gmail.com`) with no redirect.

## What you need (2 values)

| Var | Where from | Cost |
|-----|------------|------|
| `SMTP_USER` | Your sending Gmail address, e.g. `you@gmail.com` | free |
| `SMTP_APP_PASSWORD` | Generated at `myaccount.google.com`, NOT `console.cloud.google.com` | free |

> Do not confuse with `GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET` in
> `.env.example` — those are for Google OAuth login (NextAuth), not for SMTP.

## Steps (5 min, done once)

1. Go to `myaccount.google.com` > `Security`.
2. Turn ON `2-Step Verification` (required — `App passwords` menu stays hidden without it).
3. Go to `Security > App passwords` (use account search for "App passwords" if hidden).
4. Create one: Name = `BlueEye SMTP` > `Create`.
5. Copy the 16-char code shown as `xxxx xxxx xxxx xxxx`.
6. In `.env.local` (never commit), set without spaces:
   ```bash
   SMTP_USER=you@gmail.com
   SMTP_APP_PASSWORD=xxxxxxxxxxxxxxxx
   # Optional, defaults to the above:
   # SMTP_FROM="BlueEye <you@gmail.com>"
   ```
7. Restart dev server: `npm run dev`.
8. Test: register with a different inbox (e.g. `virus404beats@gmail.com`) — OTP
   must arrive there, not in `EMAIL_TO`. Check Spam/Promotions on first send.

## Workspace accounts

Admin must allow `2-Step Verification + App passwords` for the org, otherwise the
menu is hidden. Same generation flow after that.

## Limits / notes

- Gmail free limit ~500 mails/day — fine for MVP OTP volume.
- `from` must be `SMTP_USER` (Gmail forbids arbitrary spoofing).
- First OTPs often land in Spam — add sender to contacts, use consistent subject.
- Admin mails (`sendInquiryEmail`, bulk-delete OTP) still use Resend + `EMAIL_TO`.
- Without `SMTP_*` set, code falls back to existing Resend behavior (redirect to
  `EMAIL_TO`) so `npm run build` passes with no creds.
