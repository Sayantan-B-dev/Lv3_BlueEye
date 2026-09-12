import { getTicketingDashboard } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { requireTicketingAdmin } from "../_guard";

// ADMIN: ticketing dashboard stats (optionally per event).
export async function GET(request: Request) {
  const { error } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") || undefined;
    const stats = await getTicketingDashboard(eventId);
    return apiSuccess(stats);
  } catch (err: any) {
    return apiError(err.message || "Failed to load dashboard", 500);
  }
}
