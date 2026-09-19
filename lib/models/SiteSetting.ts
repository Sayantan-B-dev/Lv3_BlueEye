import mongoose from "mongoose";

/** Singleton document id for the events lock row. */
export const SITE_SETTING_EVENTS = "events";

/**
 * Single-document site switches. One row per feature key ("events").
 * Used by the one-click events freeze (public section + ticket purchase APIs).
 */
const SiteSettingSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  eventsLocked: { type: Boolean, default: false },
  eventsLockMessage: { type: String, trim: true, maxlength: 300 },
  updatedBy: { type: String, trim: true },
}, { timestamps: true, versionKey: false });

export default mongoose.models.SiteSetting || mongoose.model("SiteSetting", SiteSettingSchema);
