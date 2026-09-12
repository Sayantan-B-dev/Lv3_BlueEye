import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import TicketOrder from "@/lib/models/TicketOrder";
import { fulfillPaidOrder, sendOrderConfirmationEmail } from "@/lib/services/ticketingService";

export const dynamic = "force-dynamic";

// Razorpay server webhook (OPTIONAL — dormant unless a webhook URL is
// configured in the Razorpay dashboard). The primary confirmation path is
// POST /api/ticketing/orders/confirm, called by the checkout widget after
// payment. Kept for later hardening / reconciliation.
export async function POST(request: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[ticketing] RAZORPAY_WEBHOOK_SECRET missing");
      return NextResponse.json({ ok: false }, { status: 500 });
    }
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";
    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature || "x"))) {
      return NextResponse.json({ ok: false, error: "bad signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const event: string = payload.event || "";
    if (!event.startsWith("payment.captured") && !event.startsWith("order.paid")) {
      return NextResponse.json({ ok: true, ignored: event });
    }
    const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity || {};
    const gatewayOrderId: string | undefined =
      entity.order_id || entity.id;
    const gatewayPaymentId: string | undefined =
      entity.id && entity.order_id ? entity.id : payload.payload?.payment?.entity?.id;

    if (!gatewayOrderId || !gatewayPaymentId) {
      return NextResponse.json({ ok: false, error: "missing ids" }, { status: 400 });
    }

    await connectToDatabase();
    const existing: any = await TicketOrder.findOne({ gatewayOrderId }).lean();
    if (existing?.status === "PAID") {
      return NextResponse.json({ ok: true, duplicate: true }); // idempotent ack
    }

    const result = await fulfillPaidOrder(gatewayOrderId, gatewayPaymentId);

    // Confirmation email AFTER tickets exist (fire-and-forget; webhook already ack-safe).
    sendOrderConfirmationEmail(gatewayOrderId).catch((e) =>
      console.error("[ticketing] confirmation email fail:", e.message)
    );

    return NextResponse.json({ ok: true, orderCode: result.orderCode });
  } catch (error: any) {
    console.error("[ticketing] webhook fail:", error.message);
    // 500 so Razorpay retries; fulfillment is idempotent so retries are safe.
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
