import mongoose from "mongoose";

const InquirySchema = new mongoose.Schema({
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: "Artist", required: true },
  artistName: { type: String, required: true },
  clientName: { type: String, required: true },
  clientEmail: { type: String, required: true },
  clientPhone: { type: String, required: true },
  clientAddress: { type: String, trim: true, maxlength: 300 },
  eventDate: Date,
  eventType: { type: String, enum: ["Wedding", "Corporate", "Private Party", "College", "Other"] },
  message: String,
  status: { type: String, enum: ["New", "Contacted", "Closed"], default: "New" },
  notes: String
}, { timestamps: true });

// Hot paths: profile-by-email, admin newest-first lists.
InquirySchema.index({ clientEmail: 1 });
InquirySchema.index({ createdAt: -1 });

export default mongoose.models.Inquiry || mongoose.model("Inquiry", InquirySchema);
