import { searchTicketOrders, refundTicketOrder, createCompOrder } from "@/lib/services/ticketingService";
import { ticketBuyerValidation } from "@/lib/utils/validators";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { requireTicketingAdmin, requireTicketingStaff } from "../_guard";

// ADMIN + STAFF: search orders (name/phone/email/order/ticket/payment id).
export async function GET(request: Request) {
  const { error } = await requireTicketingStaff();
  if (error) return error;
  try {
    const { searchParams } = new URL(request.url);
    const orders = await searchTicketOrders(searchParams.get("q") || "", 100);
    return apiSuccess(orders);
  } catch (err: any) {
    return apiError(err.message || "Search failed", 500);
  }
}

// ADMIN: refund a PAID order (tickets CANCELLED, inventory released).
export async function PATCH(request: Request) {
  const { error, session } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const { orderId } = await request.json();
    if (!orderId) return apiError("orderId is required", 400);
    const order = await refundTicketOrder(orderId);
    console.log(`[ticketing] order ${order.orderCode} refunded by ${(session!.user as any).email}`);
    return apiSuccess(order, "Order refunded");
  } catch (err: any) {
    return apiError(err.message || "Refund failed", 400);
  }
}

// ADMIN: manual complimentary order (Rs 0 tier, auto-PAID with QR).
export async function POST(request: Request) {
  const { error, session } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const { slug, tierCode, qty, buyer } = await request.json();
    const parsed = ticketBuyerValidation.safeParse(buyer);
    if (!slug || !tierCode || !parsed.success) {
      return apiError(parsed.success ? "slug and tierCode are required" : parsed.error.issues[0].message, 400);
    }
    const staff = (session!.user as any).email || "admin";
    const result = await createCompOrder(slug, tierCode, Number(qty) || 1, parsed.data, staff);
    return apiSuccess(result, "Complimentary tickets created", 201);
  } catch (err: any) {
    return apiError(err.message || "Failed to create tickets", 400);
  }
}
