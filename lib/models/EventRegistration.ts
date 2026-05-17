import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  guestName: { type: String, required: true, trim: true },
  guestEmail: { type: String, required: true, trim: true, lowercase: true },
  guestPhone: { type: String, required: true, trim: true },
  headcount: { type: Number, default: 1, min: 1 },
  message: { type: String },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Waitlisted"],
    default: "Pending",
  },
  whatsappSent: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  adminNotes: { type: String },
}, { timestamps: true, versionKey: false });

export default mongoose.models.EventRegistration ||
  mongoose.model("EventRegistration", eventRegistrationSchema);
