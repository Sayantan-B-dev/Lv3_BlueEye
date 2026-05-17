import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { updateRegistrationStatus } from "@/lib/services/eventRegistrationService";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") return null;
  return session;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; rid: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { rid } = await params;
    const { status, adminNotes } = await req.json();
    const allowed = ["Pending", "Approved", "Rejected", "Waitlisted"];
    if (!allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    const reg = await updateRegistrationStatus(rid, status, adminNotes);
    return NextResponse.json({ success: true, registration: reg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
