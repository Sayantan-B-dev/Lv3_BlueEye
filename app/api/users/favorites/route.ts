import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getCache, setCache, invalidateCache } from "@/lib/db/redis";
import {
  cacheConfig,
  userFavoritesCacheKey,
  userFavoritesIdsCacheKey,
} from "@/lib/config/cache";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    const userId = (session.user as any).id;
    const cacheKey = userFavoritesCacheKey(userId);

    // 1. Try to fetch from Redis
    const cachedFavs = await getCache<any[]>(cacheKey);
    if (cachedFavs) {
      return apiSuccess(cachedFavs);
    }

    // 2. Pull from MongoDB
    await connectToDatabase();
    const user = await User.findById(userId).populate("favorites").lean();
    const favorites = user?.favorites || [];

    // 3. Cache inside Redis for 30 minutes (1800 seconds)
    await setCache(cacheKey, favorites, cacheConfig.user.favoritesTtlSeconds);
    
    return apiSuccess(favorites);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch favorites", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    const { artistId } = await request.json();
    const userId = (session.user as any).id;
    const cacheKey = userFavoritesCacheKey(userId);
    const cacheIdsKey = userFavoritesIdsCacheKey(userId);

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return apiError("User not found", 404);

    const index = user.favorites.indexOf(artistId);
    if (index > -1) {
      user.favorites.splice(index, 1); // Remove if exists
    } else {
      user.favorites.push(artistId); // Add if not exists
    }

    await user.save();

    // 4. Invalidate the favorites caches in Redis so the next GET receives fresh data!
    await invalidateCache(cacheKey);
    await invalidateCache(cacheIdsKey);

    return apiSuccess(user.favorites, "Favorites updated");
  } catch (error: any) {
    return apiError(error.message || "Failed to update favorites", 500);
  }
}
