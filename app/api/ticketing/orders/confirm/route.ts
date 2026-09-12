import { confirmRazorpayPayment } from "@/lib/services/ticketingService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// PUBLIC (guest): confirm a completed Razorpay checkout WITHOUT a webhook.
// Verifies the HMAC signature server-side AND confirms the payment is
// captured via the Razorpay API before minting tickets. Idempotent.
export async function POST(request: Request) {
  try {
    const { gatewayOrderId, gatewayPaymentId, signature } = await request.json();
    if (!gatewayOrderId || !gatewayPaymentId || !signature) {
      return apiError("Payment details are incomplete", 400);
    }
    const result = await confirmRazorpayPayment(
      String(gatewayOrderId),
      String(gatewayPaymentId),
      String(signature)
    );
    return apiSuccess(
      { orderCode: result.orderCode, tickets: result.tickets },
      "Payment confirmed"
    );
  } catch (error: any) {
    return apiError(error.message || "Payment confirmation failed", 400);
  }
}
