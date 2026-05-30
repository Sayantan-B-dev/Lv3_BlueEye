import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { getEvents, createEvent, getEventStats } from "@/lib/services/eventService";
import { importEventsFromJSON } from "@/lib/services/importService";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const [result, stats] = await Promise.all([
      getEvents({ page, limit }),
      getEventStats(),
    ]);
    return NextResponse.json({ ...result, stats });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();

    if (Array.isArray(body)) {
      const summary = await importEventsFromJSON(body);
      return NextResponse.json({ success: true, data: summary, message: "Bulk import completed" }, { status: 201 });
    }

    if (!body.title || !body.startDate || !body.category) {
      return NextResponse.json({ error: "title, category, and startDate are required" }, { status: 400 });
    }
    const event = await createEvent(body);
    return NextResponse.json({ success: true, event }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
