import crypto from "crypto";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/db/connect";
import Event from "@/lib/models/Event";
import TicketTier from "@/lib/models/TicketTier";
import TicketOrder from "@/lib/models/TicketOrder";
import Ticket from "@/lib/models/Ticket";
import { nextSequence } from "@/lib/models/Counter";
import { sendTicketConfirmation } from "@/lib/utils/email";
import { invalidateCache } from "@/lib/db/redis";
import { cacheConfig } from "@/lib/config/cache";
import { lockStateForEvent } from "@/lib/services/eventLockService";

/** Thrown when a public purchase path is hit while the event page is frozen. */
export class EventLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EventLockedError";
  }
}

/**
 * Public purchase gate. Deliberately narrow: staff paths (comp tickets, check-in,
 * order confirm, Razorpay webhook) stay open so in-flight payments issued before
 * a freeze can still mint tickets and nobody is left with paid-but-ticketless orders.
 */
async function assertPurchaseOpen(event: unknown): Promise<void> {
  const lock = await lockStateForEvent(event as { ticketing?: { locked?: boolean } } | null);
  if (lock.locked) throw new EventLockedError(lock.message);
}

let razorpay: Razorpay | null = null;

export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getRazorpay(): Razorpay {
  if (razorpay) return razorpay;
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "",
  });
  return razorpay;
}

/** e.g. rang-de-bhakti -> RDB */
export function eventCodeFromSlug(slug: string): string {
  const code = slug.split("-").map((p) => p[0] || "").join("").toUpperCase();
  return code || "EVT";
}

function ticketingOf(event: any) {
  return {
    enabled: event.ticketing?.enabled === true,
    feePct: event.ticketing?.feePct ?? 0,
    feeFlatPaise: event.ticketing?.feeFlatPaise ?? 0,
    gstPct: event.ticketing?.gstPct ?? 0,
    maxPerOrder: event.ticketing?.maxPerOrder ?? 6,
  };
}

export async function getTicketedEvent(slug: string) {
  await connectToDatabase();
  const event = await Event.findOne({ slug: slug.toLowerCase() }).lean();
  if (!event || !(event as any).ticketing?.enabled) return null;
  const tiers = await TicketTier.find({ eventId: (event as any)._id })
    .sort({ pricePaise: 1 })
    .lean();
  return { event, tiers, config: ticketingOf(event) };
}

export interface Quote {
  tierCode: string;
  tierName: string;
  unitPaise: number;
  qty: number;
  remaining: number;
  subtotalPaise: number;
  feePaise: number;
  gstPaise: number;
  totalPaise: number;
  currency: string;
}

/** Server-side pricing. Never trust frontend amounts. */
export async function quoteTickets(slug: string, tierCode: string, qty: number): Promise<Quote> {
  const data = await getTicketedEvent(slug);
  if (!data) throw new Error("Ticketing is not enabled for this event");
  const { tiers, config } = data;
  await assertPurchaseOpen(data.event);
  if (qty < 1 || qty > config.maxPerOrder) {
    throw new Error(`You can book 1 to ${config.maxPerOrder} tickets per order`);
  }
  const tier: any = tiers.find((t: any) => t.code === tierCode.toUpperCase());
  if (!tier || tier.status !== "Active") throw new Error("Ticket category unavailable");
  const remaining = Math.max(0, tier.totalQty - tier.soldQty);
  if (qty > remaining) throw new Error(`Only ${remaining} ${tier.name} tickets left`);

  const subtotalPaise = tier.pricePaise * qty;
  const feePaise =
    Math.round((subtotalPaise * config.feePct) / 100) + config.feeFlatPaise;
  const gstPaise = Math.round(((subtotalPaise + feePaise) * config.gstPct) / 100);
  return {
    tierCode: tier.code,
    tierName: tier.name,
    unitPaise: tier.pricePaise,
    qty,
    remaining,
    subtotalPaise,
    feePaise,
    gstPaise,
    totalPaise: subtotalPaise + feePaise + gstPaise,
    currency: "INR",
  };
}

export interface BuyerInput {
  name: string;
  email: string;
  phone: string;
  dob?: string;
  city?: string;
}

/** Creates a PENDING order + Razorpay order. No tickets yet. */
export async function createTicketOrder(
  slug: string,
  tierCode: string,
  qty: number,
  buyer: BuyerInput
) {
  if (!isRazorpayConfigured()) throw new Error("Online payments are not configured yet");
  const quote = await quoteTickets(slug, tierCode, qty);
  const data = await getTicketedEvent(slug);
  if (!data) throw new Error("Ticketing is not enabled for this event");
  const event: any = data.event;

  const year = new Date().getFullYear();
  const ecode = eventCodeFromSlug(event.slug);
  const seq = await nextSequence(`order:${event._id}`);
  const orderCode = `BE-${ecode}-${year}-${String(seq).padStart(6, "0")}`;

  const rzp = getRazorpay();
  const rzpOrder = await rzp.orders.create({
    amount: quote.totalPaise,
    currency: "INR",
    receipt: orderCode,
    notes: { event: event.slug, tier: quote.tierCode, qty: String(qty) },
  });

  const tier: any = data.tiers.find((t: any) => t.code === quote.tierCode);
  const order = await TicketOrder.create({
    orderCode,
    eventId: event._id,
    buyer: {
      name: buyer.name.trim(),
      email: buyer.email.toLowerCase().trim(),
      phone: buyer.phone.trim(),
      dob: buyer.dob?.trim() || undefined,
      city: buyer.city?.trim() || undefined,
    },
    items: [
      {
        tierId: tier._id,
        tierCode: tier.code,
        tierName: tier.name,
        unitPaise: tier.pricePaise,
        qty,
      },
    ],
    subtotalPaise: quote.subtotalPaise,
    feePaise: quote.feePaise,
    gstPaise: quote.gstPaise,
    totalPaise: quote.totalPaise,
    currency: "INR",
    gateway: "razorpay",
    gatewayOrderId: rzpOrder.id,
    status: quote.totalPaise === 0 ? "PAID" : "PENDING",
    paidAt: quote.totalPaise === 0 ? new Date() : undefined,
  });

  return {
    orderCode: order.orderCode,
    gatewayOrderId: rzpOrder.id,
    totalPaise: quote.totalPaise,
    currency: "INR",
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    buyer: order.buyer,
    quote,
  };
}

/** HMAC-SHA256 signature check for Razorpay webhooks / checkout responses. */
export function verifyRazorpaySignature(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export interface TicketIssueResult {
  orderCode: string;
  tickets: { ticketCode: string; secureToken: string; attendeeName: string }[];
  alreadyProcessed: boolean;
}

/**
 * Idempotent fulfillment: safe to call twice for the same payment.
 * Reserves inventory atomically, then mints one ticket per seat.
 */
export async function fulfillPaidOrder(
  gatewayOrderId: string,
  gatewayPaymentId: string
): Promise<TicketIssueResult> {
  await connectToDatabase();
  const order: any = await TicketOrder.findOne({ gatewayOrderId });
  if (!order) throw new Error("Order not found");

  if (order.status === "PAID") {
    const existing = await Ticket.find({ orderId: order._id }).lean();
    return {
      orderCode: order.orderCode,
      tickets: existing.map((t: any) => ({
        ticketCode: t.ticketCode,
        secureToken: t.secureToken,
        attendeeName: t.attendeeName,
      })),
      alreadyProcessed: true,
    };
  }
  if (["REFUNDED", "CANCELLED"].includes(order.status)) {
    throw new Error(`Order is ${order.status}`);
  }

  const event: any = await Event.findById(order.eventId).lean();
  const ecode = eventCodeFromSlug(event?.slug || "event");
  const minted: TicketIssueResult["tickets"] = [];

  for (const item of order.items) {
    // Atomic guard: decrement ONLY if enough inventory remains (single op, no race).
    const tier: any = await TicketTier.findOneAndUpdate(
      {
        _id: item.tierId,
        $expr: { $gte: [{ $subtract: ["$totalQty", "$soldQty"] }, item.qty] },
      },
      { $inc: { soldQty: item.qty } },
      { returnDocument: "after" }
    );
    if (!tier) {
      order.status = "FAILED";
      await order.save();
      throw new Error(`Not enough ${item.tierName} tickets left — payment will be refunded`);
    }
    for (let i = 1; i <= item.qty; i++) {
      const tseq = await nextSequence(`ticket:${item.tierId}`);
      const ticketCode = `${ecode}-${item.tierCode}-${String(tseq).padStart(6, "0")}`;
      const secureToken = crypto.randomBytes(32).toString("hex");
      const attendeeName =
        item.qty === 1 ? order.buyer.name : `${order.buyer.name} (${i})`;
      const t = await Ticket.create({
        ticketCode,
        eventId: order.eventId,
        orderId: order._id,
        tierId: item.tierId,
        tierCode: item.tierCode,
        tierName: item.tierName,
        attendeeIdx: i,
        attendeeName,
        secureToken,
        status: "ACTIVE",
      });
      minted.push({ ticketCode: t.ticketCode, secureToken, attendeeName });
    }
  }

  order.status = "PAID";
  order.gatewayPaymentId = gatewayPaymentId;
  order.paidAt = new Date();
  order.webhookEvents.push({ paymentId: gatewayPaymentId, at: new Date() });
  await order.save();
  bustTicketingCache(order.eventId);

  return { orderCode: order.orderCode, tickets: minted, alreadyProcessed: false };
}

export async function getTicketByToken(secureToken: string) {
  await connectToDatabase();
  const ticket: any = await Ticket.findOne({ secureToken }).lean();
  if (!ticket) return null;
  const event: any = await Event.findById(ticket.eventId).lean();
  const order: any = await TicketOrder.findById(ticket.orderId).lean();
  return { ticket, event, orderCode: order?.orderCode };
}

export interface CheckinResult {
  ok: boolean;
  reason?: "NOT_FOUND" | "INVALID_TOKEN" | "UNPAID" | "NOT_ACTIVE" | "ALREADY_USED" | "WRONG_EVENT";
  ticket?: any;
  firstCheckedInAt?: Date;
}

/** Staff check-in: 6 backend checks, duplicate-safe. */
export async function checkinTicket(
  secureToken: string,
  staff: string,
  eventId?: string
): Promise<CheckinResult> {
  await connectToDatabase();
  const ticket: any = await Ticket.findOne({ secureToken });
  if (!ticket) return { ok: false, reason: "NOT_FOUND" };
  if (eventId && String(ticket.eventId) !== String(eventId)) {
    return { ok: false, reason: "WRONG_EVENT" };
  }
  const order: any = await TicketOrder.findById(ticket.orderId).lean();
  if (!order || order.status !== "PAID") return { ok: false, reason: "UNPAID", ticket };
  if (ticket.status === "CHECKED_IN") {
    return { ok: false, reason: "ALREADY_USED", ticket, firstCheckedInAt: ticket.checkedInAt };
  }
  if (ticket.status !== "ACTIVE") return { ok: false, reason: "NOT_ACTIVE", ticket };
  ticket.status = "CHECKED_IN";
  ticket.checkedInAt = new Date();
  ticket.checkinStaff = staff || "staff";
  ticket.checkinHistory.push({ action: "checkin", at: new Date(), staff: staff || "staff" });
  await ticket.save();
  return { ok: true, ticket };
}

export interface UndoResult {
  ok: boolean;
  reason?: "NOT_FOUND" | "NOT_CHECKED_IN" | "NOTE_REQUIRED";
  ticket?: any;
}

/** Supervisor undo: revert a mis-scan. Requires a note; everything is logged. */
export async function undoCheckin(
  secureToken: string,
  staff: string,
  note: string
): Promise<UndoResult> {
  if (!note || !note.trim()) return { ok: false, reason: "NOTE_REQUIRED" };
  await connectToDatabase();
  const ticket: any = await Ticket.findOne({ secureToken: String(secureToken || "").trim() });
  if (!ticket) return { ok: false, reason: "NOT_FOUND" };
  if (ticket.status !== "CHECKED_IN") return { ok: false, reason: "NOT_CHECKED_IN", ticket };
  ticket.status = "ACTIVE";
  ticket.checkedInAt = undefined;
  ticket.checkinHistory.push({
    action: "undo",
    at: new Date(),
    staff: staff || "staff",
    note: note.trim().slice(0, 300),
  });
  await ticket.save();
  return { ok: true, ticket };
}

export async function getTicketingDashboard(eventId?: string) {
  await connectToDatabase();
  const tierFilter: any = eventId ? { eventId } : {};
  const tiers: any[] = await TicketTier.find(tierFilter).lean();
  const orderFilter: any = eventId ? { eventId } : {};
  const orders: any[] = await TicketOrder.find(orderFilter).lean();
  const tickets: any[] = await Ticket.find(eventId ? { eventId } : {}).lean();

  const paid = orders.filter((o) => o.status === "PAID");
  const revenuePaise = paid.reduce((s, o) => s + (o.totalPaise || 0), 0);
  const byStatus: Record<string, number> = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;

  return {
    capacity: tiers.reduce((s, t) => s + t.totalQty, 0),
    sold: tiers.reduce((s, t) => s + t.soldQty, 0),
    tiers: tiers.map((t) => ({
      code: t.code,
      name: t.name,
      pricePaise: t.pricePaise,
      totalQty: t.totalQty,
      soldQty: t.soldQty,
      remaining: Math.max(0, t.totalQty - t.soldQty),
      status: t.status,
    })),
    orders: orders.length,
    orderStatus: byStatus,
    revenuePaise,
    checkedIn: tickets.filter((t) => t.status === "CHECKED_IN").length,
    activeTickets: tickets.filter((t) => t.status === "ACTIVE").length,
  };
}

export async function searchTicketOrders(q: string, limit = 50) {
  await connectToDatabase();
  // Blank query = recent-orders fast path (no match-all regex scan).
  if (!q.trim()) {
    return TicketOrder.find({}).sort({ createdAt: -1 }).limit(limit).lean();
  }
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const ticketMatch: any = await Ticket.findOne({
    $or: [{ ticketCode: rx }, { secureToken: q }],
  }).lean();
  const filter: any = {
    $or: [
      { orderCode: rx },
      { "buyer.name": rx },
      { "buyer.email": rx },
      { "buyer.phone": rx },
      { gatewayPaymentId: rx },
    ],
  };
  if (ticketMatch) filter.$or.push({ _id: ticketMatch.orderId });
  return TicketOrder.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
}

/** Manual refund: order REFUNDED, tickets CANCELLED (QR dead). Gateway refund is manual in Phase 1. */
export async function refundTicketOrder(orderId: string) {
  await connectToDatabase();
  const order: any = await TicketOrder.findById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.status !== "PAID") throw new Error("Only PAID orders can be refunded");
  order.status = "REFUNDED";
  await order.save();
  bustTicketingCache(order.eventId);
  await Ticket.updateMany(
    { orderId: order._id, status: { $in: ["ACTIVE", "CHECKED_IN"] } },
    { $set: { status: "REFUNDED" } }
  );
  // Release inventory back to the tiers.
  for (const item of order.items) {
    await TicketTier.findByIdAndUpdate(item.tierId, { $inc: { soldQty: -item.qty } });
  }
  return order;
}

/** Drop cached ticketing aggregates after any inventory/order mutation. */
function bustTicketingCache(eventId: any) {
  const keys = [
    `${cacheConfig.admin.ticketingKey}:${eventId}`,
    `${cacheConfig.admin.ticketingKey}:all`,
  ];
  for (const k of keys) invalidateCache(k).catch(() => {});
}

/** Display state: ACTIVE tickets for past events read as EXPIRED. */
export function ticketDisplayStatus(ticketStatus: string, eventEnd: Date | null): string {
  if (ticketStatus !== "ACTIVE") return ticketStatus;
  if (eventEnd && Date.now() > eventEnd.getTime()) return "EXPIRED";
  return "ACTIVE";
}

/** All tickets booked with an email, newest first, with event + order info. */
export async function userTicketsFor(email: string, eventId?: string) {
  await connectToDatabase();
  const orders: any[] = await TicketOrder.find({ "buyer.email": email.toLowerCase() })
    .sort({ createdAt: -1 })
    .lean();
  const orderIds = orders.map((o) => o._id);
  if (orderIds.length === 0) return [];
  const ticketFilter: any = { orderId: { $in: orderIds } };
  if (eventId) ticketFilter.eventId = eventId;
  const tickets: any[] = await Ticket.find(ticketFilter).sort({ createdAt: -1 }).lean();
  const eventIds = [...new Set(tickets.map((t) => String(t.eventId)))];
  const events: any[] = await Event.find({ _id: { $in: eventIds } }).lean();
  const eventById = new Map(events.map((e: any) => [String(e._id), e]));
  const orderById = new Map(orders.map((o: any) => [String(o._id), o]));
  return tickets.map((t: any) => {
    const ev: any = eventById.get(String(t.eventId));
    const end = ev ? new Date(ev.endDate || ev.startDate) : null;
    return {
      ticketCode: t.ticketCode,
      tierName: t.tierName,
      attendeeName: t.attendeeName,
      secureToken: t.secureToken,
      status: t.status,
      displayStatus: ticketDisplayStatus(t.status, end),
      checkedInAt: t.checkedInAt || null,
      orderCode: (orderById.get(String(t.orderId)) as any)?.orderCode || "",
      event: ev
        ? {
            title: ev.title,
            slug: ev.slug,
            startDate: ev.startDate,
            endDate: ev.endDate || null,
            venue: ev.venue || null,
            coverImage: ev.coverImage || null,
          }
        : null,
    };
  });
}

/** Complimentary / guest ticket: Rs 0 order auto-PAID with real QR. */
export async function createCompOrder(
  slug: string,
  tierCode: string,
  qty: number,
  buyer: BuyerInput,
  staff: string
) {
  const data = await getTicketedEvent(slug);
  if (!data) throw new Error("Ticketing is not enabled for this event");
  const event: any = data.event;
  const tier: any = data.tiers.find((t: any) => t.code === tierCode.toUpperCase());
  if (!tier) throw new Error("Ticket category not found");
  if (tier.pricePaise !== 0) throw new Error("Complimentary orders require a Rs 0 tier");

  const year = new Date().getFullYear();
  const ecode = eventCodeFromSlug(event.slug);
  const seq = await nextSequence(`order:${event._id}`);
  const orderCode = `BE-${ecode}-${year}-${String(seq).padStart(6, "0")}`;

  const order: any = await TicketOrder.create({
    orderCode,
    eventId: event._id,
    buyer: {
      name: buyer.name.trim(),
      email: buyer.email.toLowerCase().trim(),
      phone: buyer.phone.trim(),
      city: buyer.city?.trim() || undefined,
    },
    items: [{ tierId: tier._id, tierCode: tier.code, tierName: tier.name, unitPaise: 0, qty }],
    subtotalPaise: 0,
    feePaise: 0,
    gstPaise: 0,
    totalPaise: 0,
    currency: "INR",
    gateway: "manual",
    status: "PROCESSING",
  });

  const minted: { ticketCode: string; secureToken: string; attendeeName: string }[] = [];
  const reserved: any = await TicketTier.findOneAndUpdate(
    {
      _id: tier._id,
      $expr: { $gte: [{ $subtract: ["$totalQty", "$soldQty"] }, qty] },
    },
    { $inc: { soldQty: qty } },
    { returnDocument: "after" }
  );
  if (!reserved) {
    order.status = "FAILED";
    await order.save();
    throw new Error("Not enough tickets left");
  }
  for (let i = 1; i <= qty; i++) {
    const tseq = await nextSequence(`ticket:${tier._id}`);
    const secureToken = crypto.randomBytes(32).toString("hex");
    const attendeeName = qty === 1 ? order.buyer.name : `${order.buyer.name} (${i})`;
    const t = await Ticket.create({
      ticketCode: `${ecode}-${tier.code}-${String(tseq).padStart(6, "0")}`,
      eventId: event._id,
      orderId: order._id,
      tierId: tier._id,
      tierCode: tier.code,
      tierName: tier.name,
      attendeeIdx: i,
      attendeeName,
      secureToken,
      status: "ACTIVE",
      checkinStaff: `comp:${staff}`,
    });
    minted.push({ ticketCode: t.ticketCode, secureToken, attendeeName });
  }
  order.status = "PAID";
  order.paidAt = new Date();
  await order.save();
  bustTicketingCache(order.eventId);
  return { orderCode, tickets: minted };
}

/**
 * Email the buyer their tickets + QR codes. Call ONLY after the order is PAID.
 */
export async function sendOrderConfirmationEmail(gatewayOrderId: string) {
  await connectToDatabase();
  const order: any = await TicketOrder.findOne({ gatewayOrderId }).lean();
  if (!order || order.status !== "PAID") return;
  const event: any = await Event.findById(order.eventId).lean();
  const tickets: any[] = await Ticket.find({ orderId: order._id }).lean();
  const venue = [event?.venue?.name, event?.venue?.city, event?.venue?.state]
    .filter(Boolean)
    .join(", ");
  const support =
    [event?.contactInfo?.phone, event?.contactInfo?.email].filter(Boolean).join(" · ") ||
    "Blue Eye Entertainment";
  await sendTicketConfirmation({
    toEmail: order.buyer.email,
    buyerName: order.buyer.name,
    orderCode: order.orderCode,
    totalPaise: order.totalPaise,
    eventTitle: event?.title || "Blue Eye Event",
    eventDate: event?.startDate || new Date().toISOString(),
    venue: venue || "See event page for venue",
    supportContact: support,
    tickets: tickets.map((t: any) => ({
      ticketCode: t.ticketCode,
      tierName: t.tierName,
      attendeeName: t.attendeeName,
      secureToken: t.secureToken,
    })),
  });
}

/**
 * Webhook-less confirmation: verify the checkout signature server-side AND
 * confirm the payment is captured via the Razorpay API, then fulfill.
 * Same trust as a webhook (key_secret never leaves the server).
 */
export async function confirmRazorpayPayment(
  gatewayOrderId: string,
  gatewayPaymentId: string,
  signature: string
) {
  await connectToDatabase();
  const order: any = await TicketOrder.findOne({ gatewayOrderId });
  if (!order) throw new Error("Order not found");
  if (order.status === "PAID") {
    const existing = await Ticket.find({ orderId: order._id }).lean();
    return {
      orderCode: order.orderCode,
      alreadyProcessed: true,
      tickets: existing.map((t: any) => ({
        ticketCode: t.ticketCode,
        secureToken: t.secureToken,
        attendeeName: t.attendeeName,
      })),
    };
  }
  if (!verifyRazorpaySignature(gatewayOrderId, gatewayPaymentId, signature)) {
    throw new Error("Payment verification failed");
  }
  if (!isRazorpayConfigured()) throw new Error("Online payments are not configured yet");
  const payment: any = await getRazorpay().payments.fetch(gatewayPaymentId);
  if (payment.order_id !== gatewayOrderId) throw new Error("Payment does not match this order");
  if (payment.status !== "captured") {
    order.status = "FAILED";
    await order.save();
    throw new Error(`Payment is ${payment.status}, not captured`);
  }
  if (Math.round(Number(payment.amount)) !== order.totalPaise) {
    throw new Error("Paid amount does not match order total");
  }
  const result = await fulfillPaidOrder(gatewayOrderId, gatewayPaymentId);
  sendOrderConfirmationEmail(gatewayOrderId).catch((e) =>
    console.error("[ticketing] confirmation email fail:", e.message)
  );
  return { ...result, alreadyProcessed: false };
}
