import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { undoCheckin } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// ADMIN + STAFF: revert a mis-scan. Requires a reason note; logged in history.
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    if (!session || (role !== "admin" && role !== "staff")) {
      return apiError("Unauthorized", 401);
    }
    const { token, note } = await request.json();
    if (!token) return apiError("Ticket token is required", 400);
    const staff = (session.user as any).email || "staff";
    const result = await undoCheckin(String(token).trim(), staff, String(note || ""));
    if (!result.ok) {
      const messages: Record<string, string> = {
        NOT_FOUND: "Ticket not found",
        NOT_CHECKED_IN: "Only checked-in tickets can be reverted",
        NOTE_REQUIRED: "A reason note is required for undo",
      };
      return apiError(messages[result.reason || "NOT_FOUND"] || "Undo failed", 400);
    }
    const t: any = result.ticket;
    return apiSuccess(
      { ticketCode: t.ticketCode, tierName: t.tierName, attendeeName: t.attendeeName },
      "Check-in reverted — ticket is ACTIVE again"
    );
  } catch (error: any) {
    return apiError(error.message || "Undo failed", 500);
  }
}
