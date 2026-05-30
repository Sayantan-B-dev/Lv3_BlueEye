import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { importReviewsFromJSON } from "@/lib/services/importService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const summary = await importReviewsFromJSON(body);
      return NextResponse.json({ success: true, data: summary, message: "Bulk import completed" }, { status: 201 });
    }

    return NextResponse.json({ error: "Single review creation not supported here, use array for bulk import" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
