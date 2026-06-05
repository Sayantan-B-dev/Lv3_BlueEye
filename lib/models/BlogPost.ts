import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  excerpt: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  coverImage: { type: String },
  category: { type: String, trim: true },
  tags: [String],
  author: { type: String, default: "Blue Eye Entertainment Team" },
  published: { type: Boolean, default: true },
  publishedAt: { type: Date },
  featured: { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

blogPostSchema.index({ title: "text", excerpt: "text", content: "text" });

export default mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);
