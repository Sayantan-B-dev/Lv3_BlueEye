import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { userTicketsFor } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// USER: all tickets booked with this account's email (with event info + expiry).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return apiError("Unauthorized", 401);
    return apiSuccess(await userTicketsFor(session.user.email));
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch tickets", 500);
  }
}
