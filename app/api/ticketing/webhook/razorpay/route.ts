import crypto from "crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import TicketOrder from "@/lib/models/TicketOrder";
import { fulfillPaidOrder } from "@/lib/services/ticketingService";
import { sendTicketConfirmation } from "@/lib/utils/email";
import Event from "@/lib/models/Event";
import Ticket from "@/lib/models/Ticket";

async function sendTicketConfirmationForOrder(gatewayOrderId: string) {
  const order: any = await TicketOrder.findOne({ gatewayOrderId }).lean();
  if (!order) return;
  const event: any = await Event.findById(order.eventId).lean();
  const venue = [event?.venue?.name, event?.venue?.city, event?.venue?.state]
    .filter(Boolean)
    .join(", ");
  const support = [event?.contactInfo?.phone, event?.contactInfo?.email]
    .filter(Boolean)
    .join(" · ") || "Blue Eye Entertainment";
  const full: any[] = await Ticket.find({ orderId: order._id }).lean();
  await sendTicketConfirmation({
    toEmail: order.buyer.email,
    buyerName: order.buyer.name,
    orderCode: order.orderCode,
    totalPaise: order.totalPaise,
    eventTitle: event?.title || "Blue Eye Event",
    eventDate: event?.startDate || new Date().toISOString(),
    venue: venue || "See event page for venue",
    supportContact: support,
    tickets: full.map((t: any) => ({
      ticketCode: t.ticketCode,
      tierName: t.tierName,
      attendeeName: t.attendeeName,
      secureToken: t.secureToken,
    })),
  });
}

export const dynamic = "force-dynamic";

// Razorpay server webhook. Verifies raw-body HMAC, fulfills idempotently.
// NOTE: Phase 7 wires the confirmation email here after tickets are minted.
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
    sendTicketConfirmationForOrder(gatewayOrderId).catch((e) =>
      console.error("[ticketing] confirmation email fail:", e.message)
    );

    return NextResponse.json({ ok: true, orderCode: result.orderCode });
  } catch (error: any) {
    console.error("[ticketing] webhook fail:", error.message);
    // 500 so Razorpay retries; fulfillment is idempotent so retries are safe.
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
