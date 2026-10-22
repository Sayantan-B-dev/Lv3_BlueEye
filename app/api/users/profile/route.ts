import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { getErrorMessage, privateApiSuccess, privateApiError } from "@/lib/utils/apiResponse";
import { invalidateCache } from "@/lib/db/redis";
import {
  userFavoritesCacheKey,
  userFavoritesIdsCacheKey,
  userReviewCacheKey,
} from "@/lib/config/cache";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser) return privateApiError("Unauthorized", 401);

    const userId = sessionUser.id;
    await connectToDatabase();

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select("name username email role address contactDetails").lean();
    }
    if (!user && sessionUser.email) {
      user = await User.findOne({ email: sessionUser.email }).select("name username email role address contactDetails").lean();
    }

    if (!user) {
      // If still not found in DB (e.g. predefined static admin without DB record yet),
      // return a default fallback record so the profile UI can load and write to it.
      return privateApiSuccess({
        name: sessionUser.name || "Admin",
        email: sessionUser.email,
        role: sessionUser.role || "admin",
        username: sessionUser.username || "admin",
        address: "",
        contactDetails: ""
      });
    }

    return privateApiSuccess(user);
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to fetch profile"), 500);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser) return privateApiError("Unauthorized", 401);

    const userId = sessionUser.id;
    const sessionRole =
      sessionUser.role === "admin" || sessionUser.role === "staff" || sessionUser.role === "user"
        ? sessionUser.role
        : "admin";
    const { name, address, contactDetails } = await request.json();

    await connectToDatabase();

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && sessionUser.email) {
      user = await User.findOne({ email: sessionUser.email });
    }

    if (!user) {
      // Provision DB record for predefined admin / unprovisioned users on first save
      user = await User.create({
        name: name || sessionUser.name || "Admin",
        email: sessionUser.email || "",
        role: sessionRole,
        username: sessionUser.username || "admin",
        address: address || "",
        contactDetails: contactDetails || "",
        isVerified: true
      });
    } else {
      if (name !== undefined) user.name = name;
      if (address !== undefined) user.address = address;
      if (contactDetails !== undefined) user.contactDetails = contactDetails;
      await user.save();
    }

    return privateApiSuccess({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      address: user.address,
      contactDetails: user.contactDetails
    }, "Profile updated successfully");
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to update profile"), 500);
  }
}

// Deletes ONLY the user's own profile record. Related documents (reviews,
// applications, event registrations, inquiries) are intentionally left alone.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser) return privateApiError("Unauthorized", 401);

    const userId = sessionUser.id;

    await connectToDatabase();

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && sessionUser.email) {
      user = await User.findOne({ email: sessionUser.email });
    }

    if (!user) {
      return privateApiError("User not found", 404);
    }

    // Admin credentials come from environment variables, so removing their DB
    // record would just be undone on the next login. Admins are deleted from
    // the database directly instead.
    if (user.role === "admin") {
      return privateApiError(
        "Admin accounts cannot be deleted from here. Please contact the platform owner.",
        403
      );
    }

    await User.deleteOne({ _id: user._id });

    // Drop cached copies so a re-registered account starts clean.
    const deletedId = user._id.toString();
    await invalidateCache(userFavoritesCacheKey(deletedId));
    await invalidateCache(userFavoritesIdsCacheKey(deletedId));
    await invalidateCache(userReviewCacheKey(deletedId));

    return privateApiSuccess(null, "Your profile has been deleted");
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to delete profile"), 500);
  }
}
