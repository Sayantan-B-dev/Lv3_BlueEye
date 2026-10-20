import { getRandomArtists } from "@/lib/services/artistService";
import { getDistinctCategories, getCategoryCounts } from "@/lib/services/searchService";
import { getCache, setCache } from "@/lib/db/redis";
import { cacheConfig } from "@/lib/config/cache";

/** @deprecated Use cacheConfig.homeData.redisKey */
export const HOME_CACHE_KEY = cacheConfig.homeData.redisKey;

export type HomePageData = {
  randomArtists: Awaited<ReturnType<typeof getRandomArtists>>;
  categories: string[];
  counts: Record<string, number>;
};

export async function getHomePageData(): Promise<HomePageData> {
  // v2: projection now trims artist documents to the fields the homepage renders.
  const cacheKey = `${cacheConfig.homeData.redisKey}:v2`;
  const cached = await getCache<HomePageData>(cacheKey);
  if (cached) return cached;

  const [randomArtists, categories, counts] = await Promise.all([
    getRandomArtists(10),
    getDistinctCategories(),
    getCategoryCounts(),
  ]);

  const freshData: HomePageData = { randomArtists, categories, counts };
  await setCache(cacheKey, freshData, cacheConfig.homeData.ttlSeconds);
  return freshData;
}
