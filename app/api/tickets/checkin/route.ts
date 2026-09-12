import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { checkinTicket } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { rateLimit, clientIp } from "@/lib/utils/rateLimit";

// ADMIN + STAFF: scan/verify a ticket QR token and mark CHECKED_IN.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== "admin" && role !== "staff")) {
      return apiError("Unauthorized", 401);
    }
    if (!rateLimit(`checkin:${clientIp(request)}`, 120)) {
      return apiError("Too many requests, try again shortly", 429);
    }
    const { token, eventId } = await request.json();
    if (!token) return apiError("Ticket token is required", 400);
    const staff = (session.user as any).email || "staff";
    const result = await checkinTicket(String(token).trim(), staff, eventId);
    if (!result.ok) {
      const messages: Record<string, string> = {
        NOT_FOUND: "Ticket not found",
        UNPAID: "Payment not confirmed for this ticket",
        NOT_ACTIVE: "Ticket is no longer valid",
        ALREADY_USED: "Ticket already used",
        WRONG_EVENT: "Ticket belongs to a different event",
      };
      return apiError(messages[result.reason || "NOT_FOUND"] || "Invalid ticket", 409, {
        reason: result.reason,
        ticket: result.ticket
          ? {
              ticketCode: result.ticket.ticketCode,
              tierName: result.ticket.tierName,
              attendeeName: result.ticket.attendeeName,
            }
          : undefined,
        firstCheckedInAt: result.firstCheckedInAt || result.ticket?.checkedInAt || null,
      } as any);
    }
    const t: any = result.ticket;
    return apiSuccess({
      ticketCode: t.ticketCode,
      tierName: t.tierName,
      attendeeName: t.attendeeName,
      checkedInAt: t.checkedInAt,
    }, "ENTRY APPROVED");
  } catch (error: any) {
    return apiError(error.message || "Check-in failed", 500);
  }
}
