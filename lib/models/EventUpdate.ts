import mongoose from "mongoose";

const eventUpdateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ["Info", "Alert", "Milestone", "Media"],
    default: "Info",
  },
  attachments: [String], // ImageKit URLs
  postedBy: { type: String, default: "Admin" },
}, { timestamps: true, versionKey: false });

export default mongoose.models.EventUpdate ||
  mongoose.model("EventUpdate", eventUpdateSchema);
