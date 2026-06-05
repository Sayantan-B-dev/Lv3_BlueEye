import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String },
  username: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String }, // Not required for OAuth users
  image: { type: String },
  role: { type: String, enum: ["admin", "user"], default: "user" },
  isVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
  verificationCodeExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  address: { type: String },
  contactDetails: { type: String },
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Artist" }],
  lastSubmissionAt: { type: Date }
}, { timestamps: true });

// Clear the cached model if it exists to force re-compilation with the updated schema
if (mongoose.models && mongoose.models.User) {
  delete mongoose.models.User;
}

export default mongoose.model("User", UserSchema);
