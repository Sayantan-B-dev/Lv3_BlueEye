import { connectToDatabase } from "@/lib/db/connect";
import TicketOrder from "@/lib/models/TicketOrder";
import Ticket from "@/lib/models/Ticket";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// PUBLIC (guest): poll order status after payment.
// Requires buyer email match — order codes alone are not auth.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderCode: string }> }
) {
  try {
    const { orderCode } = await params;
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").toLowerCase().trim();
    if (!email) return apiError("Email is required", 400);
    await connectToDatabase();
    const order: any = await TicketOrder.findOne({ orderCode }).lean();
    if (!order || order.buyer?.email !== email) {
      return apiError("Order not found", 404);
    }
    let tickets: any[] = [];
    if (order.status === "PAID") {
      tickets = await Ticket.find({ orderId: order._id }).lean();
    }
    return apiSuccess({
      orderCode: order.orderCode,
      status: order.status,
      totalPaise: order.totalPaise,
      tickets: tickets.map((t: any) => ({
        ticketCode: t.ticketCode,
        tierName: t.tierName,
        attendeeName: t.attendeeName,
        secureToken: t.secureToken,
      })),
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to load order", 500);
  }
}
