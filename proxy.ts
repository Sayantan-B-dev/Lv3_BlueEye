import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { slugify } from "@/lib/utils/slugify";

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const isDeployPreview = host.includes("netlify.app") || host.includes("vercel.app");

  if (isDeployPreview) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

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
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|site.webmanifest|android-chrome-.*|apple-touch-icon.*).*)",
  ],
};
