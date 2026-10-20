# Cloudflare + Turnstile setup

Operational guide for putting Cloudflare in front of the Netlify site and adding
Turnstile to public forms.

**Status:** documentation only. Turnstile is **not wired into the code yet**; the
Cloudflare proxy is **not enabled**. Nothing in this guide changes production by
itself.

---

## 1. Cost and optionality

Everything in this guide is **optional** and can be enabled in stages.

| Item | Cost | Needed for | Notes |
| --- | --- | --- | --- |
| Cloudflare DNS | Free | Proxy/WAF/CDN | Domain stays registered at Hostinger; only the nameservers change |
| Cloudflare CDN + Universal SSL | Free | Caching, HTTPS | Unmetered DDoS protection |
| Bot Fight Mode | Free | Bot mitigation | Can challenge unusual/API clients; test |
| WAF custom rules | Free (5 rules) | Block known bad UAs | One rule can contain all UA checks |
| Cache Rules | Free (10 rules) | Cache public HTML at the edge | HTML is **not** cached by default |
| Rate limiting | Free (1 rule) | Limit floods per IP | Free limits: 10 s window, 10 s block, IP only, path/verified-bot fields, Block action |
| Turnstile | Free | Protect forms from scripts | 20 widgets, unlimited challenges, 10 hostnames per widget |
| Cloudflare Pro | $20/month | More rules, Managed Challenge, longer windows | **Not required** |

Notes:

- Turnstile works **without** moving DNS to Cloudflare. You can add it first with
  zero DNS risk.
- Moving nameservers to Cloudflare is free, but you must recreate **all** DNS
  records, including MX/SPF/DKIM/DMARC. Missing mail records break email.
- The domain is **not transferred** away from Hostinger; only DNS hosting moves.
- If anything goes wrong, revert the nameservers at Hostinger. The old Hostinger
  DNS zone remains available.

Recommended order:

1. Turnstile (no DNS change).
2. Cloudflare proxy/WAF/cache.
3. Pagination `generateStaticParams` only if telemetry still justifies it.

---

## 2. Current setup

- Registrar: **Hostinger** (`blueeyeentertainment.in`).
- Hosting: **Netlify** (site URL looks like `<your-site>.netlify.app`).
- DNS: currently Hostinger; the site is connected with Hostinger DNS records.

Collect before starting:

- [ ] Netlify site name (`<your-site>.netlify.app`).
- [ ] Exact DNS records shown in Netlify → **Domain management → Domain
      configuration** (apex and `www`).
- [ ] All records in Hostinger → **Domains → DNS / Nameservers**: A, AAAA, CNAME,
      MX, TXT (SPF, DKIM, DMARC), and any mail/autodiscover records.
- [ ] Current Hostinger nameservers (screenshot/notes, for rollback).

---

## 3. Option A — Turnstile only (recommended first)

No nameserver or DNS changes. Free.

### 3.1 Create the widget

1. Cloudflare dashboard → **Turnstile** → **Add widget**.
2. Name: `BlueEye forms`.
3. Hostnames: `blueeyeentertainment.in`, `www.blueeyeentertainment.in`,
   `localhost`.
4. Widget mode: **Managed**.
5. Copy the **site key** and **secret key**.

### 3.2 Add environment variables

Netlify → Site configuration → Environment variables, and local `.env.local`:

```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
TURNSTILE_SECRET_KEY=...
```

- `NEXT_PUBLIC_*` is exposed to the browser (safe; it is the site key).
- `TURNSTILE_SECRET_KEY` is server-only. Never commit it.
- Update `docs/env_example.md` with placeholders (do not add real values).

### 3.3 Code to add (not implemented yet)

Add `lib/utils/turnstile.ts`:

```ts
export async function verifyTurnstile(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // keys not configured (local/dev)
  if (typeof token !== "string" || !token) return { ok: false };

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token, remoteip: ip }),
        signal: AbortSignal.timeout(5000),
      }
    );
    const data = await res.json();
    return { ok: data.success === true, codes: data["error-codes"] };
  } catch {
    return { ok: false };
  }
}
```

Add `components/security/TurnstileWidget.tsx`:

- Load `https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`.
- Render into a container with `window.turnstile.render(...)`.
- Pass the token up via an `onToken` callback.
- Call `window.turnstile.reset()` after a failed submit (tokens are single-use,
  5-minute lifetime).
- Render nothing when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is missing.

Wire it into:

- [ ] `components/forms/EmailForm.tsx` → include `turnstileToken` in the
      `/api/contact` and `/api/inquiries` payloads.
- [ ] `components/for-artists/ApplicantForm.tsx` → `/api/artist-applications`.
- [ ] Registration view in `app/login/page.tsx` → `/api/auth/register`.
- [ ] Login submit → `signIn("credentials", { ..., turnstileToken })`.
- [ ] `lib/auth/authOptions.ts` → add `turnstileToken` to the credentials
      definition and verify it in `authorize`.
- [ ] Optionally `app/admin/login/page.tsx`.

Server routes must extract and verify the token **before** validation/DB/email:

- `app/api/contact/route.ts`
- `app/api/inquiries/route.ts`
- `app/api/artist-applications/route.ts`
- `app/api/auth/register/route.ts`
- `lib/auth/authOptions.ts` (credentials login)

Return `403` when verification fails. Do not trust the client-side widget alone.

### 3.4 CSP

Turnstile needs iframe + script access. In `next.config.ts`, add
`https://challenges.cloudflare.com` to:

- `script-src`
- `frame-src`
- `connect-src`

Without this the widget is blocked by the current CSP.

### 3.5 Test keys

Before using real keys, Cloudflare's dummy keys always pass:

- Site key: `1x00000000000000000000AA`
- Secret: `1x0000000000000000000000000000000AA`

Also test the "always fails" secret (`2x0000000000000000000000000000000AA`)
to confirm the server rejects bad tokens.

Turnstile tokens are single-use and expire after 300 seconds. If a user leaves
the form open too long, the server returns `timeout-or-duplicate`; reset the
widget and show "please try again".

---

## 4. Option B — Cloudflare proxy (full setup)

This gives DNS, CDN caching, WAF and Bot Fight Mode. It requires changing
nameservers at Hostinger.

### 4.1 Add the site to Cloudflare

1. Create a free Cloudflare account.
2. **Add a site** → enter `blueeyeentertainment.in` → Free plan.
3. Cloudflare scans existing DNS records. Review them against the Hostinger
   list; the scan is not guaranteed to be complete.
4. Note the two assigned nameservers (for example `ada.ns.cloudflare.com` and
   `bob.ns.cloudflare.com`).

### 4.2 Recreate DNS records in Cloudflare

Use the exact values from Netlify's **Domain management** screen. Typical
external-DNS setup:

| Type | Name | Content | Proxy |
| --- | --- | --- | --- |
| CNAME | `@` | `apex-loadbalancer.netlify.com` | DNS only first |
| CNAME | `www` | `<your-site>.netlify.app` | DNS only first |
| MX | `@` | copy from Hostinger (e.g. Hostinger mail) | n/a |
| TXT | `@` | SPF record, copied exactly | n/a |
| TXT | `_dmarc` | DMARC record, copied exactly | n/a |
| TXT | `default._domainkey` | DKIM record, copied exactly | n/a |

Rules:

- Cloudflare supports CNAME flattening at the apex, so the Netlify apex
  load-balancer CNAME is the preferred option.
- If Netlify shows a different target (High-Performance Edge), use the value
  Netlify gives you, not the example.
- Keep all mail records. Also copy any `mail`, `autodiscover`, `ftp` or
  verification records you find.
- Start with **DNS only** (grey cloud) for the web records so Netlify can verify
  the domain and issue its certificate.
- Do **not** create a proxied `AAAA` record unless the target supports IPv6.

### 4.3 Change nameservers at Hostinger

1. Hostinger hPanel → **Domains** → select `blueeyeentertainment.in`.
2. Open **Nameservers** (or **DNS / Nameservers**).
3. Choose **Use custom nameservers**.
4. Enter the two Cloudflare nameservers.
5. Save and wait for Cloudflare to show **Active** (usually minutes to a few
   hours; up to 24–48 h worst case).

Do not cancel the Hostinger domain registration. Only DNS hosting changes.

### 4.4 Verify Netlify and SSL

1. Netlify → Domain management → confirm the domain verifies.
2. Wait for the Netlify certificate to be issued/renewed.
3. In Cloudflare → **SSL/TLS**:
   - Encryption mode: **Full (strict)**
   - Enable **Always Use HTTPS**
   - Do **not** use Flexible (redirect loops).
4. Once Netlify is verified and HTTPS works, switch the web records to
   **Proxied** (orange cloud).

If Netlify cannot verify the domain while proxied, set the web records back to
DNS only, finish verification/certificate issuance, then proxy again.

### 4.5 Bot Fight Mode

Cloudflare → **Security → Bots** → enable **Bot Fight Mode**.

- Do not enable "Under Attack" permanently.
- Verify that Googlebot/Bingbot can still crawl (Cloudflare allows verified
  bots).
- Test the Razorpay webhook after enabling; server-to-server callbacks can be
  challenged. If needed, add a WAF Skip rule for
  `/api/ticketing/webhook/razorpay`.

### 4.6 WAF custom rule — block known scrapers

**Security → WAF → Custom rules → Create rule**.

Expression (case-insensitive):

```txt
(lower(http.user_agent) contains "ahrefsbot") or
(lower(http.user_agent) contains "semrushbot") or
(lower(http.user_agent) contains "mj12bot") or
(lower(http.user_agent) contains "amzn-searchbot") or
(lower(http.user_agent) contains "meta-externalagent")
```

Action: **Block**.

This uses one of the 5 free custom-rule slots. Keep a separate rule for the
Razorpay webhook if you need to skip bot checks.

### 4.7 Rate limiting rule (free plan limits)

**Security → WAF → Rate limiting rules → Create rule**.

Free-plan constraints:

- 1 rule
- 10-second counting period
- 10-second mitigation
- Count by IP only
- Expression fields: path and verified bot only
- Action: Block (Managed Challenge is a Pro+ option)

Expression:

```txt
(http.request.uri.path eq "/") or
starts_with(http.request.uri.path, "/api/")
```

Add an exclusion for the payment webhook. On the free plan, create the rule so
it does not match the webhook, or add a higher-priority Skip/Security rule:

```txt
not http.request.uri.path eq "/api/ticketing/webhook/razorpay"
```

Suggested threshold: **30 requests per 10 seconds per IP**, block for 10 seconds.

Why 30: one page load may trigger the HTML document plus a few API calls, but
not 30 in 10 seconds. Static JS/CSS/images are not matched. Shared NAT/office
networks may need a higher value; watch Security Events for false positives.

Never rate-limit or challenge `/api/ticketing/webhook/razorpay`.

### 4.8 Cache rule — public HTML at the edge

Cloudflare does not cache HTML by default, and it ignores
`Netlify-CDN-Cache-Control`. Create a **Cache Rule** (free plan: 10 rules).

**Caching → Cache Rules → Create rule**.

Match:

```txt
(http.request.method eq "GET")
and (http.host eq "blueeyeentertainment.in" or http.host eq "www.blueeyeentertainment.in")
and not starts_with(http.request.uri.path, "/api/")
and not starts_with(http.request.uri.path, "/admin")
and not starts_with(http.request.uri.path, "/profile")
and not starts_with(http.request.uri.path, "/my-ticket")
and not starts_with(http.request.uri.path, "/search")
and not starts_with(http.request.uri.path, "/og")
and not (http.request.uri.query contains "_rsc")
```

Settings:

- Cache eligibility: **Eligible for cache**
- Edge TTL: **Override origin**, 1 hour
- Browser TTL: respect origin
- Cache key → Query string: **Ignore** these parameters:
  `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`,
  `fbclid`, `gclid`, `gbraid`, `wbraid`

Why exclude `_rsc`: Next.js client navigation requests use `?_rsc=...` and must
receive an RSC payload, not cached HTML. Why exclude `/og`: the query string
selects the image. Why exclude the account/admin/API paths: they must never be
served from a shared cache.

After a Netlify deploy, purge Cloudflare's cache (Caching → Configuration →
Purge Everything) or wait up to 1 hour for the edge TTL.

### 4.9 Verify

```bash
curl -sI https://blueeyeentertainment.in/ | grep -iE "server|cf-cache-status|cache-control"
curl -sI https://blueeyeentertainment.in/login | grep -i cf-cache-status
curl -sI https://blueeyeentertainment.in/artists | grep -i cf-cache-status
```

Expected:

- `server: cloudflare`
- First hit `cf-cache-status: MISS`, later hits `HIT`
- `/api/*` not cached
- A tagged URL (`/?utm_source=test`) uses the same cache entry as `/`

Then watch Netlify → Analytics for 24 hours: function invocations and bandwidth
should drop, especially for `/`, `/login`, listings and sitemaps.

### 4.10 Rollback

1. Hostinger → Nameservers → restore the original Hostinger nameservers.
2. Wait for DNS propagation.
3. Netlify and email records were never deleted from Hostinger's zone; reverting
   restores the previous setup.
4. Turnstile can remain enabled independently.

Do not delete the Cloudflare zone until you are sure you will not need it.

---

## 5. Optional later: pagination prebuild

Do this only if the post-Cloudflare report still shows meaningful function usage
on paginated routes.

For `/artists/page/[page]`:

```ts
const PAGE_SIZE = 24;

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { total } = await getArtists({ page: 1, limit: PAGE_SIZE });
    const totalPages = Math.ceil(total / PAGE_SIZE);
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({
      page: String(i + 2),
    }));
  } catch {
    return [];
  }
}
```

- `/category/[category]/page/[page]`: safe to prebuild all pages.
- `/city/[city]/page/[page]` and `/category/[category]/[city]/page/[page]`:
  prebuild only pages 2–3 for the top cities/combos.
- Keep `dynamicParams = true` so non-prebuild pages still render on demand.
- `generateStaticParams` runs DB queries at build time; wrap in `try/catch` and
  cap the list.

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `DNS_PROBE_FINISHED_NXDOMAIN` | Records missing after nameserver change | Recreate A/CNAME records in Cloudflare |
| `522` / `521` from Cloudflare | Origin unreachable/refusing | Check Netlify domain config; use DNS-only temporarily |
| Redirect loop | SSL mode Flexible | Set Full (strict) |
| Netlify says domain not pointing | Proxied records hide Netlify target | Set grey cloud, verify, then proxy |
| Email stopped | MX/SPF/DKIM/DMARC not copied | Recreate mail records exactly; restore Hostinger NS if urgent |
| `cf-cache-status: BYPASS` on HTML | Cache rule not matching / not proxied | Check rule expression and orange cloud |
| RSC navigation broken | `_rsc` requests served cached HTML | Ensure the `_rsc` exclusion is present |
| Turnstile widget missing | CSP or missing site key | Add `challenges.cloudflare.com` to CSP; check env |
| Turnstile always fails | Wrong hostname, expired/reused token, secret mismatch | Add hostname, reset widget, check keys |
| `timeout-or-duplicate` | Token older than 5 min or already used | Reset widget and retry |
| Razorpay webhook blocked | Bot Fight/rate limit challenge | Skip rule for `/api/ticketing/webhook/razorpay` |

---

## 7. Security notes

- Never commit `TURNSTILE_SECRET_KEY`, Cloudflare API tokens or DNS credentials.
- The Turnstile site key is public; the secret is server-only.
- Verify every token server-side; the widget alone does not protect a form.
- Do not cache authenticated/personalized responses publicly. The cache rule
  excludes `/admin`, `/profile`, `/my-ticket`, `/search`, `/api/*`.
- Turnstile tokens are single-use and expire after 5 minutes.
- Keep a rollback path for DNS changes; nameserver changes can affect email.

---

## 8. Checklist

- [ ] Turnstile widget created; site/secret keys stored in Netlify env.
- [ ] Turnstile verified server-side on contact, inquiry, application, register
      and login.
- [ ] CSP allows `https://challenges.cloudflare.com`.
- [ ] DNS records copied from Hostinger and Netlify before nameserver change.
- [ ] Cloudflare nameservers set at Hostinger; zone Active.
- [ ] Netlify domain verified; certificate issued.
- [ ] Web records proxied; SSL Full (strict); Always Use HTTPS.
- [ ] Bot Fight Mode enabled; Razorpay webhook tested.
- [ ] WAF UA block rule deployed.
- [ ] Rate limiting rule deployed with webhook exclusion.
- [ ] Cache rule deployed; `_rsc` and `/og` excluded; UTM params ignored.
- [ ] `cf-cache-status: HIT` verified on `/` and `/login`.
- [ ] 24 h Netlify comparison captured.
