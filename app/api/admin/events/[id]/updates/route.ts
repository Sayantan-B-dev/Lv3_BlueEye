import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { addEventUpdate } from "@/lib/services/eventService";
import EventUpdate from "@/lib/models/EventUpdate";
import { connectToDatabase } from "@/lib/db/connect";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await connectToDatabase();
    const updates = await EventUpdate.find({ eventId: id }).sort({ createdAt: -1 }).lean();
    return NextResponse.json(JSON.parse(JSON.stringify(updates)));
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    if (!body.content) return NextResponse.json({ error: "content is required" }, { status: 400 });
    const update = await addEventUpdate(id, {
      content: body.content,
      type: body.type || "Info",
      attachments: body.attachments || [],
      postedBy: (session.user as any)?.name || "Admin",
    });
    return NextResponse.json({ success: true, update }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
