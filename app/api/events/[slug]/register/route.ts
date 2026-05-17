import { NextResponse, type NextRequest } from "next/server";
import { registerForEvent } from "@/lib/services/eventRegistrationService";
import { getEventBySlug } from "@/lib/services/eventService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await req.json();
    const { guestName, guestEmail, guestPhone, headcount, message } = body;

    if (!guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: "Name, email, and phone are required" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || undefined;

    const reg = await registerForEvent({
      eventId: event._id,
      userId,
      guestName,
      guestEmail,
      guestPhone,
      headcount: headcount || 1,
      message,
    });

    return NextResponse.json({ success: true, registration: reg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
