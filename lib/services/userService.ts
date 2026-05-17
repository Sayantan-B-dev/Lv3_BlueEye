import User from "@/lib/models/User";
import { connectToDatabase } from "@/lib/db/connect";
import mongoose from "mongoose";
import { getCache, setCache } from "@/lib/db/redis";

export async function getUserFavorites(userId: string) {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return [];
  }
  
  const cacheKey = `user_favorites_ids_${userId}`;
  const cachedIds = await getCache<string[]>(cacheKey);
  if (cachedIds) {
    return cachedIds;
  }

  await connectToDatabase();
  const user = await User.findById(userId).select("favorites").lean();
  const favorites = user?.favorites?.map((f: any) => f.toString()) || [];
  
  await setCache(cacheKey, favorites, 1800); // Cache for 30 mins
  return favorites;
}
