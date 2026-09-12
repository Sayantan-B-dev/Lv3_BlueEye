import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  tierId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketTier", required: true },
  tierCode: { type: String, required: true },
  tierName: { type: String, required: true },
  unitPaise: { type: Number, required: true, min: 0 },
  qty: { type: Number, required: true, min: 1 },
}, { _id: false });

const buyerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  dob: { type: String, trim: true },
  city: { type: String, trim: true },
}, { _id: false });

/**
 * Ticket purchase order. Backend-generated orderCode (BE-<EVT>-YYYY-NNNNNN).
 * Tickets are created ONLY after the Razorpay webhook verifies payment.
 */
const TicketOrderSchema = new mongoose.Schema({
  orderCode: { type: String, required: true, unique: true, index: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  buyer: { type: buyerSchema, required: true },
  items: { type: [orderItemSchema], required: true },
  subtotalPaise: { type: Number, required: true, min: 0 },
  feePaise: { type: Number, default: 0, min: 0 },
  gstPaise: { type: Number, default: 0, min: 0 },
  totalPaise: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  gateway: { type: String, default: "razorpay" },
  gatewayOrderId: { type: String, unique: true, sparse: true, index: true },
  gatewayPaymentId: { type: String, unique: true, sparse: true },
  gatewaySignature: { type: String },
  status: {
    type: String,
    enum: ["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED"],
    default: "PENDING",
    index: true,
  },
  webhookEvents: [{ paymentId: String, at: Date }],
  metaPixelEventId: { type: String },
  paidAt: { type: Date },
}, { timestamps: true, versionKey: false });

// Hot paths: profile/mine by buyer email, per-event newest-first, dashboard scans.
TicketOrderSchema.index({ "buyer.email": 1 });
TicketOrderSchema.index({ eventId: 1, createdAt: -1 });

export default mongoose.models.TicketOrder || mongoose.model("TicketOrder", TicketOrderSchema);
