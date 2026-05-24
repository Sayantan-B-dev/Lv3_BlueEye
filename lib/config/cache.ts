/** Cache keys and TTLs — override via environment variables. */

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const redisPrefix = process.env.REDIS_CACHE_KEY_PREFIX?.trim() || "blueeye";

function redisKey(...parts: string[]) {
  return [redisPrefix, ...parts].join(":");
}

export const cacheConfig = {
  redisPrefix,

  homeData: {
    redisKey: process.env.HOME_DATA_REDIS_CACHE_KEY?.trim() || redisKey("home", "data"),
    ttlSeconds: envInt("HOME_DATA_CACHE_TTL_SECONDS", 600),
    /** Browser sessionStorage key (client — use NEXT_PUBLIC_ in .env) */
    clientSessionKey:
      process.env.NEXT_PUBLIC_HOME_CLIENT_CACHE_KEY?.trim() || "blueeye_home_data",
  },

  auth: {
    pendingUserTtlSeconds: envInt("AUTH_PENDING_USER_TTL_SECONDS", 600),
  },

  user: {
    favoritesTtlSeconds: envInt("USER_FAVORITES_CACHE_TTL_SECONDS", 1800),
  },

  reviews: {
    allMarqueeKey:
      process.env.REVIEWS_ALL_MARQUEE_CACHE_KEY?.trim() || redisKey("reviews", "marquee"),
    allMarqueeTtlSeconds: envInt("REVIEWS_ALL_MARQUEE_CACHE_TTL_SECONDS", 300),
    mineTtlSeconds: envInt("REVIEWS_MINE_CACHE_TTL_SECONDS", 300),
  },
} as const;

export function pendingUserCacheKey(email: string) {
  const prefix =
    process.env.AUTH_PENDING_USER_CACHE_PREFIX?.trim() || redisKey("auth", "pending-user");
  return `${prefix}:${email.toLowerCase()}`;
}

export function userFavoritesCacheKey(userId: string) {
  const prefix =
    process.env.USER_FAVORITES_CACHE_PREFIX?.trim() || redisKey("user", "favorites");
  return `${prefix}:${userId}`;
}

export function userFavoritesIdsCacheKey(userId: string) {
  const prefix =
    process.env.USER_FAVORITES_IDS_CACHE_PREFIX?.trim() || redisKey("user", "favorites-ids");
  return `${prefix}:${userId}`;
}

export function userReviewCacheKey(userId: string) {
  const prefix =
    process.env.USER_REVIEW_CACHE_PREFIX?.trim() || redisKey("user", "review");
  return `${prefix}:${userId}`;
}
