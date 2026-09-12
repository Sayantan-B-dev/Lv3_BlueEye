import { getTicketingDashboard } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getCache, setCache } from "@/lib/db/redis";
import { cacheConfig } from "@/lib/config/cache";
import { requireTicketingStaff } from "../_guard";

// ADMIN + STAFF: ticketing dashboard stats (optionally per event), cached 30s.
export async function GET(request: Request) {
  const { error } = await requireTicketingStaff();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId") || undefined;
    const key = `${cacheConfig.admin.ticketingKey}:${eventId || "all"}`;
    const cached = await getCache<any>(key);
    if (cached) return apiSuccess(cached);
    const stats = await getTicketingDashboard(eventId);
    setCache(key, stats, cacheConfig.admin.ticketingTtlSeconds).catch(() => {});
    return apiSuccess(stats);
  } catch (err: any) {
    return apiError(err.message || "Failed to load dashboard", 500);
  }
}
