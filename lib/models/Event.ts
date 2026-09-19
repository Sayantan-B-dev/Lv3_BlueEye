import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  address: { type: String, trim: true },
}, { _id: false });

const ticketingSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  feePct: { type: Number, default: 0, min: 0 }, // platform fee %
  feeFlatPaise: { type: Number, default: 0, min: 0 }, // flat fee per order (paise)
  gstPct: { type: Number, default: 0, min: 0 }, // GST %
  maxPerOrder: { type: Number, default: 6, min: 1 },
  // Public page freeze — independent of `enabled`, so the switch never
  // touches pricing/config. Blurs the page and stops new ticket purchases.
  locked: { type: Boolean, default: false },
  lockMessage: { type: String, trim: true, maxlength: 300 },
  lockedAt: { type: Date },
}, { _id: false });

const contactInfoSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  description: { type: String },
  shortDescription: { type: String },
  category: {
    type: String,
    required: true,
    trim: true,
    default: "Other",
  },
  venue: venueSchema,
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  coverImage: { type: String },
  artists: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],
  status: {
    type: String,
    enum: ["Upcoming", "Ongoing", "Completed", "Cancelled"],
    default: "Upcoming",
  },
  featured: { type: Boolean, default: false },
  capacity: { type: Number, default: 0 }, // 0 = unlimited
  registrationOpen: { type: Boolean, default: true },
  tags: [String],
  // Ticketing (additive — existing events/RSVP flows unaffected)
  ticketing: { type: ticketingSchema, default: undefined },
  highlights: [String],
  termsConditions: { type: String },
  refundPolicy: { type: String },
  contactInfo: { type: contactInfoSchema, default: undefined },
}, { timestamps: true, versionKey: false });

eventSchema.index({ title: "text", description: "text", category: "text" });

export default mongoose.models.Event || mongoose.model("Event", eventSchema);
