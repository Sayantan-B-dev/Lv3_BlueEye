import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { apiError } from "@/lib/utils/apiResponse";

/** Shared admin guard for ticketing APIs. Returns session or an error response. */
export async function requireTicketingAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    return { error: apiError("Unauthorized", 401) as Response, session: null };
  }
  return { error: null as Response | null, session };
}

/**
 * Gate-crew guard: admin + staff. Use for read/checkin endpoints.
 * Money/config endpoints (refund, comp, tiers, config) stay admin-only.
 */
export async function requireTicketingStaff() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session || (role !== "admin" && role !== "staff")) {
    return { error: apiError("Unauthorized", 401) as Response, session: null };
  }
  return { error: null as Response | null, session };
}
