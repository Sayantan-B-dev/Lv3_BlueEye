import type { NextConfig } from "next";

const PUBLIC_PAGE_CACHE_SOURCES = [
  "/",
  "/about",
  "/contact",
  "/for-artists",
  "/privacy-policy",
  "/terms",
  "/book-artist",
  "/categories",
  "/login",
  "/register",
  "/reset-password",
  "/profile",
  "/switch-account",
  "/artists",
  "/artists/:path*",
  "/city/:path*",
  "/category/:path*",
  "/blog",
  "/blog/:path*",
  "/events",
  "/events/:path*",
  "/robots.txt",
  "/site.webmanifest",
  "/sitemap.xml",
  "/images-sitemap.xml",
  "/sitemaps/:path*",
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.2"],
  // NextAuth domain configuration - ensure cookies work correctly across domains
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "i0.wp.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    // Netlify exposes the deploy context at build time. Preview/branch builds
    // must never be indexed; production keeps the full indexing policy.
    const isDeployPreview =
      process.env.CONTEXT === "deploy-preview" || process.env.CONTEXT === "branch-deploy";
    const robotsValue = isDeployPreview
      ? "noindex, nofollow"
      : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          // Tell ALL crawlers (Google, Brave, Bing, DuckDuckGo) to index and allow snippets
          { key: "X-Robots-Tag", value: robotsValue },
          // Prevent MIME type sniffing (security)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Enforce HTTPS (HSTS) — 2 years, include subdomains, preload
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Content Security Policy — restrict script/image sources
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.youtube.com https://checkout.razorpay.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://ik.imagekit.io https://i0.wp.com https://images.unsplash.com https://placehold.co https://www.gstatic.com; font-src 'self'; connect-src 'self' https://ik.imagekit.io https://upload.imagekit.io https://*.upstash.io https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com; frame-src https://www.youtube.com https://api.razorpay.com https://checkout.razorpay.com https://challenges.cloudflare.com; media-src 'self';" },
        ],
      },
      {
        // Preconnect to ImageKit for faster image loading
        source: "/",
        headers: [
          { key: "Link", value: "<https://ik.imagekit.io>; rel=preconnect" },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|webp|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache anonymous public pages at the Netlify CDN so repeat traffic never
      // reaches a function. Auth/admin/search routes are intentionally excluded.
      ...PUBLIC_PAGE_CACHE_SOURCES.map((source) => ({
        source,
        headers: [
          {
            key: "Netlify-CDN-Cache-Control",
            value: "public, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
