import mongoose from "mongoose";

/**
 * Individual ticket. One row per seat even when a buyer purchases many.
 * Entry verification uses secureToken ONLY (never the bare ticketCode).
 */
const TicketSchema = new mongoose.Schema({
  ticketCode: { type: String, required: true, unique: true, index: true }, // RDB-VIP-000125
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketOrder", required: true, index: true },
  tierId: { type: mongoose.Schema.Types.ObjectId, ref: "TicketTier", required: true },
  tierCode: { type: String, required: true },
  tierName: { type: String, required: true },
  attendeeIdx: { type: Number, required: true, min: 1 },
  attendeeName: { type: String, required: true, trim: true },
  secureToken: { type: String, required: true, unique: true, index: true }, // crypto hex
  status: {
    type: String,
    enum: ["ACTIVE", "CHECKED_IN", "CANCELLED", "REFUNDED"],
    default: "ACTIVE",
    index: true,
  },
  checkedInAt: { type: Date },
  checkinStaff: { type: String },
  // Audit trail for gate ops (check-ins + supervisor undos).
  checkinHistory: [{
    action: { type: String, enum: ["checkin", "undo"], required: true },
    at: { type: Date, default: Date.now },
    staff: { type: String },
    note: { type: String },
  }],
}, { timestamps: true, versionKey: false });

// Hot paths: per-event scans, order lookups, profile newest-first.
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ orderId: 1, createdAt: -1 });

export default mongoose.models.Ticket || mongoose.model("Ticket", TicketSchema);
