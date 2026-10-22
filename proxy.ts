import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { legacyRedirectPath } from "@/lib/seo/legacyRoutes";
import { slugify } from "@/lib/utils/slugify";

/**
 * Normalizes non-canonical city/category slugs with a 301.
 * Scoped via `config.matcher` to those two trees so static pages and APIs do
 * not pay middleware cost on every request.
 */
export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const legacyPath = legacyRedirectPath(pathname, request.nextUrl.searchParams);
  if (legacyPath) {
    return NextResponse.redirect(new URL(legacyPath, request.url), 301);
  }

  const categoryMatch = pathname.match(/^\/category\/([^/]+)(\/page\/\d+)?$/);
  if (categoryMatch) {
    const [, raw, suffix = ""] = categoryMatch;
    const normalized = slugify(decodeURIComponent(raw));
    if (raw !== normalized) {
      return NextResponse.redirect(
        new URL(`/category/${normalized}${suffix}${search}`, request.url),
        301
      );
    }
  }

  const cityMatch = pathname.match(/^\/city\/([^/]+)(\/page\/\d+)?$/);
  if (cityMatch) {
    const [, raw, suffix = ""] = cityMatch;
    const normalized = slugify(decodeURIComponent(raw));
    if (raw !== normalized) {
      return NextResponse.redirect(
        new URL(`/city/${normalized}${suffix}${search}`, request.url),
        301
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/city/:path*",
    "/category/:path*",
    { source: "/artists", has: [{ type: "query", key: "page" }] },
    { source: "/artists", has: [{ type: "query", key: "category" }] },
    { source: "/artists", has: [{ type: "query", key: "city" }] },
    { source: "/blog", has: [{ type: "query", key: "page" }] },
    { source: "/events", has: [{ type: "query", key: "status" }] },
  ],
};
