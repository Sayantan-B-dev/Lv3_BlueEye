import mongoose from "mongoose";

/**
 * Priced ticket category for a ticketing-enabled event.
 * Inventory is decremented ATOMICALLY in the payment webhook
 * (findOneAndUpdate with soldQty guard) — never trust the frontend.
 */
const TicketTierSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  code: { type: String, required: true, trim: true, uppercase: true }, // GEN, PREM, VIP, VVIP
  name: { type: String, required: true, trim: true }, // General, Premium, VIP, VVIP
  pricePaise: { type: Number, required: true, min: 0 }, // INR paise (59900 = Rs 599)
  totalQty: { type: Number, required: true, min: 0 },
  soldQty: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["Active", "SoldOut", "Disabled"], default: "Active" },
}, { timestamps: true, versionKey: false });

TicketTierSchema.index({ eventId: 1, code: 1 }, { unique: true });

export default mongoose.models.TicketTier || mongoose.model("TicketTier", TicketTierSchema);
