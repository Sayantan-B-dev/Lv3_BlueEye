import { NextResponse, type NextRequest } from "next/server";
import { getEventBySlug } from "@/lib/services/eventService";
import { getRegistrationCountByEvent } from "@/lib/services/eventRegistrationService";

export const revalidate = 600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await getEventBySlug(slug);
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const registrationCount = await getRegistrationCountByEvent(event._id);
    return NextResponse.json({ ...event, registrationCount }, {
      headers: { "Cache-Control": "public, max-age=600, s-maxage=600" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
