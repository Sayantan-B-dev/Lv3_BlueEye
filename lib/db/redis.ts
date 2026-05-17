import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;

export const redis = global.__redis ?? (redisUrl ? new Redis(redisUrl, {
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 1500, // Fail fast in 1.5 seconds if server is down
}) : null);

if (redis) {
  redis.on("error", (err) => {
    // Silence connection error logs to prevent unhandled event spam
  });
}

if (!global.__redis && redis) {
  global.__redis = redis;
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || redis.status !== "ready") return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn("Redis GET error:", error);
    return null;
  }
}

/**
 * Safe Redis Setter Cache Helper with custom TTL (Default 1 hour)
 */
export async function setCache(key: string, value: any, ttlSeconds: number = 3600): Promise<boolean> {
  if (!redis || redis.status !== "ready") return false;
  try {
    const stringValue = JSON.stringify(value);
    await redis.set(key, stringValue, "EX", ttlSeconds);
    return true;
  } catch (error) {
    console.warn("Redis SET error:", error);
    return false;
  }
}

/**
 * Safe Redis Invalidator Cache Helper
 */
export async function invalidateCache(key: string): Promise<boolean> {
  if (!redis || redis.status !== "ready") return false;
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.warn("Redis DEL error:", error);
    return false;
  }
}
