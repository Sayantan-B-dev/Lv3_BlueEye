import { getTicketByToken } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { rateLimit, clientIp } from "@/lib/utils/rateLimit";

// PUBLIC: minimal ticket state for the my-ticket page / QR landing.
// Exposes holder name + ticket state only — no contact details.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!rateLimit(`ticket:${clientIp(request)}`, 60)) {
    return apiError("Too many requests, try again shortly", 429);
  }
  try {
    const { token } = await params;
    if (!token || token.length < 32) return apiError("Ticket not found", 404);
    const data = await getTicketByToken(token);
    if (!data) return apiError("Ticket not found", 404);
    const { ticket, event, orderCode } = data as any;
    return apiSuccess({
      ticketCode: ticket.ticketCode,
      tierName: ticket.tierName,
      attendeeName: ticket.attendeeName,
      status: ticket.status,
      checkedInAt: ticket.checkedInAt || null,
      orderCode,
      event: event
        ? {
            title: event.title,
            slug: event.slug,
            startDate: event.startDate,
            endDate: event.endDate,
            venue: event.venue,
            coverImage: event.coverImage,
            contactInfo: event.contactInfo || null,
          }
        : null,
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to load ticket", 500);
  }
}
