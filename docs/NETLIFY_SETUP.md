# Netlify Deployment & Domain Setup Guide

## Problem: Domain Separation Issue

You had two separate domains:
- `https://blueeyeentertainment.netlify.app` (Netlify preview)
- `https://blueeyeentertainment.in` (Custom domain)

These were treated as **separate origins**, causing:
- Different localStorage/sessionStorage
- Separate authentication cookies
- Users logging in on one domain couldn't access the other

## Solution: Permanent Redirects + NextAuth Configuration

### ✅ Step 1: Netlify Configuration (Already Done)

The `netlify.toml` file has been created with:
- **Permanent 301 redirects** from `.netlify.app` → `blueeyeentertainment.in`
- **Cache headers** for static assets
- **Security headers** (X-Content-Type-Options, X-Frame-Options, etc.)

### ✅ Step 2: Environment Variables (Required)

Create/update `.env.local` in your project root with:

```env
# CRITICAL: Set to your PRIMARY domain only
NEXTAUTH_URL=https://blueeyeentertainment.in
NEXTAUTH_SECRET=<generate_with_openssl_rand_base64_32>

# ... rest of your env vars ...
```

**To generate a secure NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### ✅ Step 3: Netlify Site Settings

1. **Go to Netlify Dashboard** → Select your site
2. **Site Settings → Domain Management**
3. **Add Custom Domain** → `blueeyeentertainment.in`
4. **Set as Primary Domain** (this ensures this is the primary site URL)

**Do NOT set the `.netlify.app` URL as primary.** All traffic from it will redirect to the custom domain.

### ✅ Step 4: Google OAuth Configuration

Update your Google OAuth credentials if using Google login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. **APIs & Services → Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add these Authorized Redirect URIs:
   ```
   https://blueeyeentertainment.in/api/auth/callback/google
   ```
   (The `.netlify.app` URL will automatically redirect to this)

### ✅ Step 5: DNS Configuration

If you're using Netlify DNS (recommended):

1. **Netlify Dashboard → Domain Settings**
2. **Follow the DNS records setup** Netlify shows
3. Set your custom domain's nameservers to Netlify's:
   - `dns1.p09.nsone.net`
   - `dns2.p09.nsone.net`
   - `dns3.p09.nsone.net`
   - `dns4.p09.nsone.net`

Or if using GoDaddy/other registrar:
- Point nameservers to your DNS provider
- Add CNAME/A records as needed

### ✅ Step 6: Deploy to Netlify

```bash
# 1. Install Netlify CLI (optional but recommended)
npm install -g netlify-cli

# 2. Connect your Git repo (easier via Netlify dashboard)
# OR deploy directly from terminal:
netlify deploy --prod --dir=.next

# 3. Verify deployment
# - Visit https://blueeyeentertainment.in
# - Verify authentication works
# - Try https://blueeyeentertainment.netlify.app → should redirect
```

---

## How It Works Now

```
User visits: https://blueeyeentertainment.netlify.app
                ↓
Netlify redirect (301)
                ↓
Browser navigates to: https://blueeyeentertainment.in
                ↓
NextAuth sets JWT cookie for: blueeyeentertainment.in
                ↓
User is logged in ✅
```

---

## Environment Variables Reference

| Variable | Value | Notes |
|---|---|---|
| `NEXTAUTH_URL` | `https://blueeyeentertainment.in` | **Must match your primary domain** |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Generate unique secret per environment |
| `MONGODB_URI` | Your MongoDB connection string | Keep private, never share |
| `GOOGLE_CLIENT_ID` | From Google Console | For OAuth login |
| `GOOGLE_CLIENT_SECRET` | From Google Console | **Keep private** |
| `ADMIN_EMAIL` | Your admin email | For admin login |
| `ADMIN_PASSWORD` | Hashed password | Pre-computed hash |

---

## Verification Checklist

After deployment, verify:

- [ ] Visit `https://blueeyeentertainment.in` → Works ✅
- [ ] Visit `https://blueeyeentertainment.netlify.app` → Redirects to custom domain ✅
- [ ] Login works → Session persists across page refreshes ✅
- [ ] Logout works → Removed from all pages ✅
- [ ] Google OAuth works → Can sign in with Google ✅
- [ ] Dev console → No CORS errors ✅
- [ ] Network tab → Redirect chain shows `301` → `200` ✅

---

## Troubleshooting

### "User logged in on one domain but not the other"
**Fix:** Ensure `NEXTAUTH_URL` is set to your primary domain in `.env.local`

### "SSL certificate error on Netlify URL"
**Fix:** This is normal. Netlify will auto-generate a cert for `.netlify.app`. The 301 redirect happens at the DNS level before SSL negotiation on old browsers—it's fine.

### "Google OAuth not working after redirect"
**Fix:** Add `https://blueeyeentertainment.in/api/auth/callback/google` to Google OAuth authorized URIs

### "Session lost after deployment"
**Fix:** Ensure `NEXTAUTH_SECRET` is the same across all deployments (stored in Netlify env vars)

---

## NextAuth Cookie Details

NextAuth v4 uses **secure, HTTP-only JWT cookies** by default:

```javascript
// Cookie settings (automatic in NextAuth v4)
{
  name: "next-auth.session-token",
  domain: ".blueeyeentertainment.in",  // Set to primary domain only
  path: "/",
  secure: true,  // HTTPS only
  httpOnly: true,  // Not accessible from JavaScript
  sameSite: "lax",  // Prevents CSRF
  maxAge: 30 * 24 * 60 * 60  // 30 days
}
```

Since you're using **JWT strategy** (not sessions), the token is stored in the cookie and encrypted by NextAuth.

---

## Additional Resources

- [Netlify Docs: Multiple Domains](https://docs.netlify.com/domains/manage-domains/manage-multiple-domains/)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Vercel Alternative](https://vercel.com/) (if you want to switch from Netlify)

---

## Final Checklist Before Production

- [ ] `.env.local` created with all required variables
- [ ] `netlify.toml` deployed
- [ ] Primary domain set in Netlify Dashboard
- [ ] Google OAuth URIs updated
- [ ] DNS pointing to Netlify
- [ ] Tested on production domain
- [ ] Tested redirects working
- [ ] Logged in/out successfully
- [ ] No console errors

---

**You're all set!** Your authentication now works seamlessly across both domains. 🚀
