import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { userTicketsFor } from "@/lib/services/ticketingService";
import { getErrorMessage, privateApiSuccess, privateApiError } from "@/lib/utils/apiResponse";

// USER: all tickets booked with this account's email (with event info + expiry).
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) return privateApiError("Unauthorized", 401);
    return privateApiSuccess(await userTicketsFor(userEmail));
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to fetch tickets"), 500);
  }
}
