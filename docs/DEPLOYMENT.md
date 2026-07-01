# Rentertinment — Production Deployment Guide

This document covers everything you need to deploy the Rentertinment platform to production correctly, including environment setup, platform recommendations, SEO optimisation, and post-deployment validation.

---

## Tech Stack Overview

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| Language | TypeScript |
| Database | MongoDB (Mongoose) |
| Auth | NextAuth.js v4 (Credentials + Google OAuth) |
| Image CDN | ImageKit |
| Email | Resend |
| CSS | Tailwind CSS v4 + Vanilla CSS |
| Node | v18+ recommended |

---

## Recommended Hosting Platforms

### Option 1: Vercel (Recommended — Best DX)

Vercel is purpose-built for Next.js and is the easiest, most reliable deployment option.

1. Push your code to GitHub.
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Set all environment variables in **Project → Settings → Environment Variables**.
4. Set the **Root Directory** to `/` (or the folder containing `package.json`).
5. Vercel auto-detects Next.js. Leave build command as `next build`.
6. Deploy.

> **Note:** Vercel's free plan ("Hobby") does NOT support custom domains on commercial projects. Use the Pro plan for a production business.

### Option 2: Railway

Good alternative for full-stack Node apps with built-in persistent env management.

1. Connect your GitHub repo at [railway.app](https://railway.app).
2. Set environment variables in the service dashboard.
3. Set the start command to `npm run start` and build command to `npm run build`.

### Option 3: Self-Hosted VPS (Ubuntu + Nginx + PM2)

For maximum control (e.g., DigitalOcean, Linode, AWS EC2).

```bash
# 1. Clone repo on server
git clone <your-repo-url> /var/www/rentertinment
cd /var/www/rentertinment

# 2. Install dependencies
npm ci --production=false

# 3. Create .env.local with all production variables
nano .env.local

# 4. Build for production
npm run build

# 5. Start with PM2 for process management
npm install -g pm2
pm2 start npm --name "rentertinment" -- start
pm2 save
pm2 startup

# 6. Configure Nginx reverse proxy
# /etc/nginx/sites-available/rentertinment
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 7. Enable HTTPS with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Using a GoDaddy Custom Domain

You own a domain on GoDaddy. Here's exactly how to point it to your deployment.

### Step 1 — Deploy First, Get Your Target Address

You need your host's address before touching DNS. After deploying:

| Platform | Your target address |
|---|---|
| **Vercel** | `cname.vercel-dns.com` |
| **Railway** | A URL like `yourapp.up.railway.app` |
| **VPS (DigitalOcean etc.)** | Your server's **public IPv4** address (e.g. `134.209.xx.xx`) |

### Step 2 — Configure DNS in GoDaddy

1. Log in at [dcc.godaddy.com](https://dcc.godaddy.com).
2. Click **Manage** next to your domain.
3. Go to **DNS → Manage DNS**.

**For Vercel (CNAME method):**

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `www` | `cname.vercel-dns.com` | 600 |
| `A` | `@` | `76.76.21.21` | 600 |

> The `A` record for `@` (root domain) pointing to `76.76.21.21` is Vercel's Anycast IP for apex domains.

**For a VPS (A record method):**

| Type | Name | Value | TTL |
|---|---|---|---|
| `A` | `@` | `YOUR.SERVER.IP.HERE` | 600 |
| `A` | `www` | `YOUR.SERVER.IP.HERE` | 600 |

**For Railway:**

| Type | Name | Value | TTL |
|---|---|---|---|
| `CNAME` | `www` | `yourapp.up.railway.app` | 600 |
| `CNAME` | `@` | `yourapp.up.railway.app` | 600 |

> GoDaddy does **not** support CNAME on `@` (root/apex). Use their **Forwarding** feature to redirect the root to `www`, or use Vercel/Railway's provided A record instead.

### Step 3 — Add Domain in Your Hosting Panel

**Vercel:**
1. Go to **Project → Settings → Domains**.
2. Add `yourdomain.com` and `www.yourdomain.com`.
3. Vercel will verify DNS and issue an SSL certificate automatically (within ~5 minutes).

**Railway:**
1. Go to **Service → Settings → Networking → Custom Domain**.
2. Enter your domain. Railway will show you the CNAME value to set in GoDaddy.

**VPS:**
- Your Nginx `server_name` must include both `yourdomain.com` and `www.yourdomain.com`.
- Run Certbot after DNS propagates: `sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com`

### Step 4 — Wait for DNS Propagation

DNS changes typically propagate in **5–30 minutes** but can take up to 48 hours in rare cases.

Check propagation status: [dnschecker.org](https://dnschecker.org)

### Step 5 — Update Your Environment Variables

Once the domain is live, **update these variables** in your `.env.local` (and on your hosting platform):

```env
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google
```

And update the Google Cloud Console OAuth redirect URIs (see Google OAuth section below).

### Step 6 — Verify Resend Email Domain (Optional but Recommended)

If you want emails sent from `@yourdomain.com` instead of a Resend subdomain:
1. Go to [resend.com/domains](https://resend.com/domains) → Add Domain → `yourdomain.com`.
2. Resend will give you DNS records (TXT and CNAME) to add in GoDaddy.
3. After verification, update your `EMAIL_TO` and the Resend sending address.

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values. **Never commit `.env.local` to Git.**

### Database

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=rentertinment
MONGODB_DB_COLLECTION_NAME=artists
```

- Use **MongoDB Atlas** for a managed cloud database.
- Whitelist your server's IP (or use `0.0.0.0/0` for Vercel's dynamic IPs).
- Create a dedicated DB user with **read/write** access only — never use the root user.

### Authentication

```env
NEXTAUTH_URL=https://yourdomain.com        # Must match exact production URL, no trailing slash
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong password>
ADMIN_PASSWORD_HASH=<bcrypt hash of the password>
```

> **Generating `ADMIN_PASSWORD_HASH`:**
> ```bash
> node -e "const b=require('bcryptjs'); b.hash('YOUR_PASSWORD', 12).then(console.log)"
> ```

> **Critical:** `NEXTAUTH_URL` must be the exact canonical URL (with `https://`). A mismatch causes OAuth callback errors.

### Google OAuth

```env
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google
```

**Google Cloud Console Setup:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials.
2. Edit your OAuth 2.0 Client.
3. Add to **Authorised JavaScript origins**: `https://yourdomain.com`
4. Add to **Authorised redirect URIs**: `https://yourdomain.com/api/auth/callback/google`
5. Save and wait up to 5 minutes for propagation.

### ImageKit (Image CDN)

```env
IMAGEKIT_PUBLIC_KEY=public_xxxxxxxxxxxx
IMAGEKIT_PRIVATE_KEY=private_xxxxxxxxxxxx
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

- Find these in [imagekit.io](https://imagekit.io) → Developer Options.
- Ensure your ImageKit account has sufficient upload quota for production traffic.

### Email (Resend)

```env
RESEND_API=re_xxxxxxxxxxxx
EMAIL_TO=bookings@yourdomain.com
```

- Get your API key from [resend.com](https://resend.com).
- **Verify your sending domain** in Resend by adding the required DNS TXT/CNAME records.
- Use a transactional email address (e.g., `noreply@` or `bookings@`).

### SEO & Branding (Public)

```env
NEXT_PUBLIC_BRAND_NAME=Rentertinment
NEXT_PUBLIC_BRAND_SHORT_NAME=Rentertinment
NEXT_PUBLIC_BASE_URL=https://yourdomain.com    # Used for canonical URLs, OG images, and sitemap
```

> **`NEXT_PUBLIC_BASE_URL` is the most critical SEO variable.** It determines canonical URLs, the OG image path, and the sitemap base. Getting this wrong means search engines see `http://localhost:3000` in your sitemap.

### Social Links & Contact

```env
NEXT_PUBLIC_TWITTER_URL=..
NEXT_PUBLIC_INSTAGRAM_URL=...
NEXT_PUBLIC_FACEBOOK_URL=...
NEXT_PUBLIC_YOUTUBE_URL=...
NEXT_PUBLIC_TWITTER_HANDLE=...
NEXT_PUBLIC_CONTACT_EMAIL=...
NEXT_PUBLIC_CONTACT_PHONE=...
NEXT_PUBLIC_CONTACT_ADDRESS=...
```

---

## SEO — How It Works in This Project

### Architecture

The SEO system is centralised in `lib/config/site.ts`. All metadata (page titles, descriptions, Open Graph, Twitter Cards) is generated from this single config, which reads from the `NEXT_PUBLIC_*` environment variables.

### What's Already Implemented

| Feature | Status | Location |
|---|---|---|
| Global metadata (title, description) | Done | `app/layout.tsx` |
| OpenGraph tags | Done | `app/layout.tsx` |
| Twitter Card tags | Done | `app/layout.tsx` |
| Per-page title template (`%s \| Brand`) | Done | `app/layout.tsx` |
| Dynamic sitemap (auto-includes all artist pages) | Done | `app/sitemap.ts` |
| Robots.txt configuration | Done | `app/robots.ts` |
| Canonical base URL | Done | `lib/config/site.ts` |
| Semantic HTML (`<h1>`, `<main>`, `<footer>`) | Done | All pages |

### Checklist Before Launch

#### 1. OG Image
Place a `og.jpg` file (1200×630px) in the `/public` directory. This is what appears when your link is shared on social media.

```
/public/og.jpg      ← Required for rich social previews
/public/icon.png    ← Browser tab icon (already present)
```

#### 2. Canonical URL
Ensure `NEXT_PUBLIC_BASE_URL` matches your actual domain exactly, including `https://`:
```env
# CORRECT
NEXT_PUBLIC_BASE_URL=https://rentertinment.com

# WRONG — will poison sitemap and OG tags
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=https://rentertinment.com/  # trailing slash
```

#### 3. Sitemap Submission
After deployment, submit your sitemap to search engines:
- **Google Search Console**: Add property → Submit `https://yourdomain.com/sitemap.xml`
- **Bing Webmaster Tools**: Same process

#### 4. Keywords
Current keywords in `lib/config/site.ts` are set for India's artist booking niche. Update them if your brand/niche changes:

```ts
mainKeywords: [
  "artist booking platform",
  "book bollywood singers",
  "wedding entertainment india",
  // ... add location-specific keywords
]
```

#### 5. Per-Page Metadata
Each page can export its own `metadata` for page-specific SEO. Example:

```ts
// app/artists/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const artist = await getArtist(params.slug);
  return {
    title: artist.name,  // → "Arijit Singh | Rentertinment"
    description: artist.about?.[0],
    openGraph: { images: [artist.media?.images?.[0]] }
  };
}
```

---

## Production Build

```bash
# Validate your build locally before deploying
npm run build

# Check for any TypeScript/ESLint errors
npm run lint

# Test the production build locally
npm run start
# → Visit http://localhost:3000
```

> **Always run `npm run build` locally before pushing to production** to catch errors before they reach users.

---

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is a cryptographically random 32+ byte string
- [ ] `ADMIN_PASSWORD` is not the same as your test password
- [ ] MongoDB user has minimal required permissions (read/write only, not admin)
- [ ] `.env.local` is listed in `.gitignore` (it already is)
- [ ] ImageKit private key is never exposed to the browser (`NEXT_PUBLIC_` prefix not used for private key)
- [ ] Google OAuth redirect URIs are restricted to your exact production domain
- [ ] Resend domain is verified so emails don't land in spam

---

## CI/CD (Vercel Auto-Deploy)

When connected to GitHub on Vercel:
- Every push to `main` → triggers a production deploy
- Every pull request → creates a preview deployment with its own URL

To prevent accidental production deploys, protect the `main` branch in GitHub:
> **GitHub → Repo → Settings → Branches → Add branch protection rule → Require pull request reviews**

---

## Post-Deployment Validation

After going live, verify:

```bash
# Sitemap is accessible and correct
curl https://yourdomain.com/sitemap.xml

# Robots.txt is not blocking indexing
curl https://yourdomain.com/robots.txt

# OG tags are rendering correctly
# → Use: https://opengraph.xyz or https://cards-dev.twitter.com/validator

# Check Core Web Vitals
# → Use: https://pagespeed.web.dev
```

---

## File Structure Reference

```
/
├── app/
│   ├── layout.tsx        ← Global metadata, fonts, providers
│   ├── sitemap.ts        ← Auto-generated XML sitemap
│   ├── robots.ts         ← Crawler rules
│   └── ...pages
├── lib/
│   └── config/
│       └── site.ts       ← Central SEO/brand configuration
├── public/
│   ├── og.jpg            ← Create this for social sharing
│   ├── icon.png          ← Browser tab icon
│   └── site.webmanifest  ← PWA manifest
├── .env.example          ← Template — copy to .env.local
├── .env.local            ← Your secrets — NEVER commit this
└── next.config.ts        ← Next.js configuration
```

---

*Last updated: May 2026*
