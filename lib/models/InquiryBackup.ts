import mongoose from "mongoose";

const InquiryBackupSchema = new mongoose.Schema({
  artistId: { type: mongoose.Schema.Types.ObjectId, ref: "Artist" },
  artistName: { type: String },
  clientName: { type: String },
  clientEmail: { type: String },
  clientPhone: { type: String },
  clientAddress: { type: String },
  eventDate: Date,
  eventType: { type: String },
  message: String,
  status: { type: String },
  notes: String
}, { timestamps: true, collection: "inquirybackups" });

export default mongoose.models.InquiryBackup || mongoose.model("InquiryBackup", InquiryBackupSchema);
