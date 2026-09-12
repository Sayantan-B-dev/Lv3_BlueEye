import { createTicketOrder } from "@/lib/services/ticketingService";
import { ticketOrderCreateValidation } from "@/lib/utils/validators";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// PUBLIC (guest): create a PENDING order + Razorpay order. No tickets yet.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = ticketOrderCreateValidation.safeParse({
      ...body,
      qty: Number(body.qty),
    });
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400, parsed.error.issues);
    }
    const result = await createTicketOrder(
      slug,
      parsed.data.tierCode,
      parsed.data.qty,
      parsed.data.buyer
    );
    return apiSuccess(result, "Order created", 201);
  } catch (error: any) {
    const msg = error.message || "Failed to create order";
    const status = /left|unavailable|not enabled|per order|configured|required|email|phone/i.test(msg) ? 400 : 500;
    return apiError(msg, status);
  }
}
