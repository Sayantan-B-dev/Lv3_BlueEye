import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/utils/slugify";

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const categoryMatch = pathname.match(/^\/category\/([^/]+)$/);
  if (categoryMatch) {
    const raw = categoryMatch[1];
    const normalized = slugify(decodeURIComponent(raw));
    if (raw !== normalized) {
      return NextResponse.redirect(
        new URL(`/category/${normalized}${search}`, request.url),
        301
      );
    }
  }

  const cityMatch = pathname.match(/^\/city\/([^/]+)$/);
  if (cityMatch) {
    const raw = cityMatch[1];
    const normalized = slugify(decodeURIComponent(raw));
    if (raw !== normalized) {
      return NextResponse.redirect(
        new URL(`/city/${normalized}${search}`, request.url),
        301
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/category/:path*", "/city/:path*"],
};
