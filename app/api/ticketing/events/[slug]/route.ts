import { NextResponse } from "next/server";
import { getTicketedEvent } from "@/lib/services/ticketingService";
import { getEventLockState } from "@/lib/services/eventLockService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// PUBLIC: ticketing info for an event (tiers + pricing config).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const lock = await getEventLockState(slug);
    if (lock.locked) return apiError(lock.message, 503);
    const data = await getTicketedEvent(slug);
    if (!data) return apiError("Ticketing is not available for this event", 404);
    const { event, tiers, config } = data as any;
    return apiSuccess({
      event: {
        slug: event.slug,
        title: event.title,
        startDate: event.startDate,
        venue: event.venue,
      },
      config,
      tiers: tiers.map((t: any) => ({
        code: t.code,
        name: t.name,
        pricePaise: t.pricePaise,
        remaining: Math.max(0, t.totalQty - t.soldQty),
        status: t.status,
      })),
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to load ticketing info", 500);
  }
}
