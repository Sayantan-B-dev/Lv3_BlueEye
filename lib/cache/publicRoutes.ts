export const SHARED_HTML_SOURCES = [
  "/",
  "/about",
  "/contact",
  "/for-artists",
  "/privacy-policy",
  "/terms",
  "/book-artist",
  "/categories",
  "/artists",
  "/artists/:path*",
  "/city/:path*",
  "/category/:path*",
  "/blog",
  "/blog/:path*",
  "/events",
  "/events/:path*",
] as const;

export const PRIVATE_HTML_SOURCES = [
  "/login",
  "/register",
  "/reset-password",
  "/profile",
  "/switch-account",
  "/search",
  "/admin",
  "/admin/:path*",
  "/my-ticket/:path*",
] as const;

export const SHARED_NON_HTML_SOURCES = [
  "/robots.txt",
  "/site.webmanifest",
  "/sitemap.xml",
  "/images-sitemap.xml",
  "/sitemaps/:path*",
] as const;

export const SHARED_HTML_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export const SHARED_HTML_NETLIFY_CACHE_CONTROL =
  "public, s-maxage=3600, stale-while-revalidate=86400";

export const SHARED_STATIC_CACHE_CONTROL =
  "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export const PRIVATE_CACHE_CONTROL = "private, no-store, max-age=0";

const SHARED_HTML_PATHS = new Set<string>([
  "/",
  "/about",
  "/contact",
  "/for-artists",
  "/privacy-policy",
  "/terms",
  "/book-artist",
  "/categories",
  "/artists",
  "/blog",
  "/events",
]);

const SHARED_HTML_PREFIXES = [
  "/artists/",
  "/city/",
  "/category/",
  "/blog/",
  "/events/",
];

const PRIVATE_PATHS = [
  "/login",
  "/register",
  "/reset-password",
  "/profile",
  "/switch-account",
  "/search",
  "/admin",
  "/my-ticket",
  "/api",
];

function normalizePath(pathname: string): string {
  const withoutQuery = pathname.split("?")[0] || "/";
  const withoutTrailingSlash = withoutQuery.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

export function isPrivatePath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return PRIVATE_PATHS.some(
    (privatePath) => path === privatePath || path.startsWith(`${privatePath}/`)
  );
}

export function isSharedHtmlPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (isPrivatePath(path)) return false;
  if (path === "/search") return false;
  if (SHARED_HTML_PATHS.has(path)) return true;
  return SHARED_HTML_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function isRscRequest(headers: Headers): boolean {
  return (
    headers.get("rsc") === "1" ||
    headers.has("next-router-prefetch") ||
    headers.has("next-router-segment-prefetch") ||
    (headers.get("accept") || "").includes("text/x-component")
  );
}
