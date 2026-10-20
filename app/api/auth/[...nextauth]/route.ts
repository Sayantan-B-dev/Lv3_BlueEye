import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/authOptions";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";

const handler = NextAuth(authOptions);

type RouteContext = { params: Promise<{ nextauth: string[] }> };

export async function GET(request: NextRequest, context: RouteContext) {
  return handler(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const pathname = new URL(request.url).pathname;

  // Only the credentials callback performs password verification.
  if (pathname.endsWith("/callback/credentials")) {
    const ip = clientIp(request);

    const burst = await rateLimit(`login:burst:${ip}`, 5, 60, "fail-open");
    if (!burst.allowed) {
      return NextResponse.json(
        { url: "/login?error=RateLimited" },
        { status: 429, headers: { "Retry-After": String(burst.retryAfter) } }
      );
    }

    const hourly = await rateLimit(`login:hour:${ip}`, 20, 3600, "fail-open");
    if (!hourly.allowed) {
      return NextResponse.json(
        { url: "/login?error=RateLimited" },
        { status: 429, headers: { "Retry-After": String(hourly.retryAfter) } }
      );
    }
  }

  return handler(request, context);
}
