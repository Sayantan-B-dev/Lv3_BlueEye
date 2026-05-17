import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  address: { type: String, trim: true },
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
}, { timestamps: true, versionKey: false });

eventSchema.index({ title: "text", description: "text", category: "text" });

export default mongoose.models.Event || mongoose.model("Event", eventSchema);
