import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import Review from "@/lib/models/Review";
import User from "@/lib/models/User"; // needed for population
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getCache, setCache, invalidateCache } from "@/lib/db/redis";
import { cacheConfig, userReviewCacheKey } from "@/lib/config/cache";
import mongoose from "mongoose";

export async function GET() {
  try {
    const cacheKey = cacheConfig.reviews.allMarqueeKey;

    // Try cache first
    const cachedReviews = await getCache<any[]>(cacheKey);
    if (cachedReviews) {
      return apiSuccess(cachedReviews);
    }

    await connectToDatabase();
    // Populate user name, username, image, and address (for displaying on the marquee)
    const reviews = await Review.find()
      .populate("user", "name username image address")
      .sort({ updatedAt: -1 })
      .lean();

    // Cache for 5 minutes (300 seconds)
    await setCache(cacheKey, reviews, cacheConfig.reviews.allMarqueeTtlSeconds);

    return apiSuccess(reviews);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch reviews", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return apiError("Unauthorized", 401);

    const { rating, text } = await request.json();
    if (!rating || !text) {
      return apiError("Rating and review text are required", 400);
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return apiError("Rating must be a number between 1 and 5", 400);
    }

    const userId = (session.user as any).id;

    await connectToDatabase();

    // 1. Fetch user by ID with email fallback for complete session safety
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && session.user.email) {
      user = await User.findOne({ email: session.user.email });
    }

    // 2. Verify user has an address in their profile record (address is required)
    if (!user || !user.address || !user.address.trim()) {
      return apiError("Address is required to submit a review. Please update your address in your profile details first.", 400);
    }

    let review = await Review.findOne({ user: user._id });

    if (review) {
      // User has already submitted a review, they can only edit it
      review.rating = ratingNum;
      review.text = text;
      review.isEdited = true;
      await review.save();
    } else {
      // Create new review
      review = await Review.create({
        user: user._id,
        rating: ratingNum,
        text,
        isEdited: false
      });
    }

    // Invalidate caches
    await invalidateCache(cacheConfig.reviews.allMarqueeKey);
    await invalidateCache(userReviewCacheKey(userId));

    return apiSuccess(review, review.isEdited ? "Review edited successfully" : "Review submitted successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to submit review", 500);
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) return apiError("Unauthorized", 401);

    const userId = (session.user as any).id;

    await connectToDatabase();

    // Fetch user with email fallback
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

    const deletedReview = await Review.findOneAndDelete({ user: user._id });
    if (!deletedReview) {
      return apiError("Review not found", 404);
    }

    // Invalidate caches
    await invalidateCache(cacheConfig.reviews.allMarqueeKey);
    await invalidateCache(userReviewCacheKey(userId));

    return apiSuccess(null, "Review deleted successfully");
  } catch (error: any) {
    return apiError(error.message || "Failed to delete review", 500);
  }
}
