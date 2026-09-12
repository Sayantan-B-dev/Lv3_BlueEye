import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import Event from "@/lib/models/Event";
import { userTicketsFor } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// USER: my tickets for one event (empty for guests — widget handles signup).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return apiSuccess([]);
    const { slug } = await params;
    await connectToDatabase();
    const event: any = await Event.findOne({ slug: slug.toLowerCase() }).lean();
    if (!event) return apiSuccess([]);
    return apiSuccess(await userTicketsFor(session.user.email, String(event._id)));
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch tickets", 500);
  }
}
