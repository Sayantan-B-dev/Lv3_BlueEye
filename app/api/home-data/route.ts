import { NextResponse } from "next/server";
import { getRandomArtists } from "@/lib/services/artistService";
import { getDistinctCategories, getCategoryCounts } from "@/lib/services/searchService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getCache, setCache } from "@/lib/db/redis";

export const dynamic = "force-dynamic";

const HOME_CACHE_KEY = "home_data_cache";

export async function GET() {
  try {
    // 1. Try to read from Redis
    const cachedData = await getCache<any>(HOME_CACHE_KEY);
    if (cachedData) {
      return apiSuccess(cachedData);
    }

    // 2. Fetch fresh database details
    const [randomArtists, categories, counts] = await Promise.all([
      getRandomArtists(10),
      getDistinctCategories(),
      getCategoryCounts()
    ]);
    
    const freshData = {
      randomArtists,
      categories,
      counts
    };

    // 3. Cache inside Redis for 10 minutes (600 seconds)
    await setCache(HOME_CACHE_KEY, freshData, 600);

    return apiSuccess(freshData);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch home data", 500);
  }
}
