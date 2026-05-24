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
  const cached = await getCache<HomePageData>(cacheConfig.homeData.redisKey);
  if (cached) return cached;

  const [randomArtists, categories, counts] = await Promise.all([
    getRandomArtists(10),
    getDistinctCategories(),
    getCategoryCounts(),
  ]);

  const freshData: HomePageData = { randomArtists, categories, counts };
  await setCache(cacheConfig.homeData.redisKey, freshData, cacheConfig.homeData.ttlSeconds);
  return freshData;
}
