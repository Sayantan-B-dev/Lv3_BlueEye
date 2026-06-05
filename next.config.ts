import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.2"],
  // NextAuth domain configuration - ensure cookies work correctly across domains
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
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
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: [
          // Tell ALL crawlers (Google, Brave, Bing, DuckDuckGo) to index and allow snippets
          { key: "X-Robots-Tag", value: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" },
          // Prevent MIME type sniffing (security)
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
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
    ];
  },
};

export default nextConfig;
