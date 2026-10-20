import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { isRedisConfigured, redisHealth } from "@/lib/db/redis";

export const dynamic = "force-dynamic";

/** Admin-only connectivity probe. Returns no URLs, tokens or keys. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (!isRedisConfigured) {
    return NextResponse.json(
      { success: false, configured: false, ok: false },
      { status: 503 }
    );
  }

  const health = await redisHealth();
  return NextResponse.json(
    { success: health.ok, configured: true, ...health },
    { status: health.ok ? 200 : 503 }
  );
}
