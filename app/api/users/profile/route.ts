import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
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
    if (!session || !session.user) return apiError("Unauthorized", 401);

    const userId = (session.user as any).id;
    await connectToDatabase();

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select("name username email role address contactDetails").lean();
    }
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email }).select("name username email role address contactDetails").lean();
    }

    if (!user) {
      // If still not found in DB (e.g. predefined static admin without DB record yet),
      // return a default fallback record so the profile UI can load and write to it.
      return apiSuccess({
        name: session.user.name || "Admin",
        email: session.user.email,
        role: (session.user as any).role || "admin",
        username: (session.user as any).username || "admin",
        address: "",
        contactDetails: ""
      });
    }

    return apiSuccess(user);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch profile", 500);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return apiError("Unauthorized", 401);

    const userId = (session.user as any).id;
    const { name, address, contactDetails } = await request.json();

    await connectToDatabase();

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      // Provision DB record for predefined admin / unprovisioned users on first save
      user = await User.create({
        name: name || session.user.name || "Admin",
        email: session.user.email || "",
        role: (session.user as any).role || "admin",
        username: (session.user as any).username || "admin",
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

    return apiSuccess({
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      address: user.address,
      contactDetails: user.contactDetails
    }, "Profile updated successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to update profile", 500);
  }
}

// Deletes ONLY the user's own profile record. Related documents (reviews,
// applications, event registrations, inquiries) are intentionally left alone.
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return apiError("Unauthorized", 401);

    const userId = (session.user as any).id;

    await connectToDatabase();

    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    if (!user) {
      return apiError("User not found", 404);
    }

    // Admin credentials come from environment variables, so removing their DB
    // record would just be undone on the next login. Admins are deleted from
    // the database directly instead.
    if (user.role === "admin") {
      return apiError(
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

    return apiSuccess(null, "Your profile has been deleted");
  } catch (error: any) {
    return apiError(error.message || "Failed to delete profile", 500);
  }
}
