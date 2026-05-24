import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import Review from "@/lib/models/Review";
import User from "@/lib/models/User";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getCache, setCache } from "@/lib/db/redis";
import { cacheConfig, userReviewCacheKey } from "@/lib/config/cache";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return apiError("Unauthorized", 401);

    const userId = (session.user as any).id;
    const cacheKey = userReviewCacheKey(userId);

    // Try cache first
    const cachedReview = await getCache<any>(cacheKey);
    if (cachedReview !== null) {
      return apiSuccess(cachedReview);
    }

    await connectToDatabase();

    // Fetch user with email fallback
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    let review = null;
    if (user) {
      review = await Review.findOne({ user: user._id }).lean();
    }

    // Cache user review for 5 minutes
    await setCache(cacheKey, review || {}, cacheConfig.reviews.mineTtlSeconds);

    return apiSuccess(review);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch your review", 500);
  }
}
