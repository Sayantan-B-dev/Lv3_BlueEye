import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import Review from "@/lib/models/Review";
import User from "@/lib/models/User";
import { getErrorMessage, privateApiSuccess, privateApiError } from "@/lib/utils/apiResponse";
import { getCache, setCache } from "@/lib/db/redis";
import { cacheConfig, userReviewCacheKey } from "@/lib/config/cache";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return privateApiError("Unauthorized", 401);

    const sessionUser = session.user;
    const userId = sessionUser.id;
    const cacheUserId = userId || sessionUser.email;
    if (!cacheUserId) return privateApiError("Unauthorized", 401);

    const cacheKey = userReviewCacheKey(cacheUserId);

    // Try cache first
    const cachedReview = await getCache<unknown>(cacheKey);
    if (cachedReview !== null) {
      return privateApiSuccess(cachedReview);
    }

    await connectToDatabase();

    // Fetch user with email fallback
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && sessionUser.email) {
      user = await User.findOne({ email: sessionUser.email });
    }

    let review = null;
    if (user) {
      review = await Review.findOne({ user: user._id }).lean();
    }

    // Cache user review for 5 minutes
    await setCache(cacheKey, review || {}, cacheConfig.reviews.mineTtlSeconds);

    return privateApiSuccess(review);
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to fetch your review"), 500);
  }
}
