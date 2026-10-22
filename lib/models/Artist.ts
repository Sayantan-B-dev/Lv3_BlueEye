import mongoose from "mongoose";

const durationSchema = new mongoose.Schema({ min: Number, max: Number }, { _id: false });
const teamMembersSchema = new mongoose.Schema({ min: Number, max: Number }, { _id: false });
const sourceSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  input_category: { type: String, default: null, trim: true },
  input_page: { type: Number, default: null }
}, { _id: false });
const locationSchema = new mongoose.Schema({
  city: String, state: String, country: { type: String, default: "India" }
}, { _id: false });
const performanceSchema = new mongoose.Schema({
  duration_minutes: durationSchema,
  team_members: teamMembersSchema,
  genres: [String],
  languages: [String]
}, { _id: false });
const bookingSchema = new mongoose.Schema({ url: String }, { _id: false });
const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true }
}, { _id: false });
const mediaSchema = new mongoose.Schema({
  videos: [String],
  images: [String]
}, { _id: false });
const searchSchema = new mongoose.Schema({
  name_lower: String,
  category_lower: String,
  city_lower: String,
  genres_lower: [String],
  languages_lower: [String]
}, { _id: false });

const artistSchema = new mongoose.Schema({
  id: { type: Number, unique: true, sparse: true },
  slug: { type: String, required: true, unique: true, trim: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  category: { type: String, required: true, trim: true, index: true },
  category_tag: String,
  source: sourceSchema,
  location: locationSchema,
  performance: performanceSchema,
  booking: bookingSchema,
  booking_link: String,
  about: mongoose.Schema.Types.Mixed, // Can be string or array of strings
  custom_fields: mongoose.Schema.Types.Mixed,
  faq: [faqSchema],
  media: mediaSchema,
  search: searchSchema,
  featured: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

artistSchema.index({ name: "text", about: "text", category: "text" });
artistSchema.index({ "location.city": 1 });
artistSchema.index({ "search.city_lower": 1, "search.category_lower": 1 });
artistSchema.index({ createdAt: -1 });
artistSchema.index({ updatedAt: -1 });

artistSchema.pre("save", function () {
  this.search = {
    name_lower: this.name?.toLowerCase() || "",
    category_lower: this.category?.toLowerCase() || "",
    city_lower: this.location?.city?.toLowerCase() || "",
    genres_lower: this.performance?.genres?.map((g: string) => g.toLowerCase()) || [],
    languages_lower: this.performance?.languages?.map((l: string) => l.toLowerCase()) || []
  };
});

const collectionName = process.env.MONGODB_DB_COLLECTION_NAME || "artists";

// In development, the model might be cached with the wrong collection name
// if it was loaded before the environment variables were fully ready.
const Artist = mongoose.models.Artist || mongoose.model("Artist", artistSchema, collectionName);

export default Artist;
