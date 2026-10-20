/**
 * Server-only Redis access.
 *
 * Supports two mutually exclusive configurations:
 *  - Upstash REST: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (preferred)
 *  - TCP/TLS:      REDIS_URL (ioredis fallback)
 *
 * Never import this module from a client component. Credentials are never
 * logged, returned, or included in error messages.
 */

const REST_URL = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/+$/, "");
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
const TCP_URL = process.env.REDIS_URL?.trim();

export type RedisMode = "rest" | "tcp" | "none";

export const redisMode: RedisMode =
  REST_URL && REST_TOKEN ? "rest" : TCP_URL ? "tcp" : "none";

export const isRedisConfigured = redisMode !== "none";

const COMMAND_TIMEOUT_MS = 1500;

type RedisCommand = (string | number)[];

type RestResponse = {
  result?: unknown;
  error?: string;
};

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COMMAND_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

async function restCommand<T>(command: RedisCommand): Promise<T | null> {
  if (!REST_URL || !REST_TOKEN) return null;
  try {
    const response = await fetchWithTimeout(REST_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });

    if (!response.ok) {
      console.warn(`Redis REST request failed with status ${response.status}`);
      return null;
    }

    const payload = (await response.json()) as RestResponse;
    if (payload.error) {
      console.warn(`Redis REST command failed: ${payload.error}`);
      return null;
    }
    return (payload.result ?? null) as T;
  } catch (error) {
    // Abort/timeout/network — do not include credentials or URLs in logs.
    console.warn(
      `Redis REST unavailable (${error instanceof Error ? error.name : "unknown error"})`
    );
    return null;
  }
}

async function restPipeline<T>(commands: RedisCommand[]): Promise<(T | null)[] | null> {
  if (!REST_URL || !REST_TOKEN) return null;
  try {
    const response = await fetchWithTimeout(`${REST_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REST_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      console.warn(`Redis REST pipeline failed with status ${response.status}`);
      return null;
    }

    const payload = (await response.json()) as RestResponse[];
    if (!Array.isArray(payload)) return null;
    return payload.map((entry) => {
      if (entry?.error) {
        console.warn(`Redis REST pipeline command failed: ${entry.error}`);
        return null;
      }
      return (entry?.result ?? null) as T | null;
    });
  } catch (error) {
    console.warn(
      `Redis REST pipeline unavailable (${error instanceof Error ? error.name : "unknown error"})`
    );
    return null;
  }
}

let tcpClient: import("ioredis").Redis | null | undefined;

async function getTcpClient(): Promise<import("ioredis").Redis | null> {
  if (redisMode !== "tcp" || !TCP_URL) return null;
  if (tcpClient !== undefined) return tcpClient;

  try {
    const { default: Redis } = await import("ioredis");
    tcpClient = new Redis(TCP_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: COMMAND_TIMEOUT_MS,
    });
    tcpClient.on("error", () => {
      // Silence connection error spam; callers use safe helpers below.
    });
  } catch {
    tcpClient = null;
  }

  return tcpClient;
}

function isTcpReady(client: import("ioredis").Redis | null): client is import("ioredis").Redis {
  return Boolean(client && client.status === "ready");
}

/** Run a single command against whichever backend is configured. */
export async function redisCommand<T = unknown>(command: RedisCommand): Promise<T | null> {
  if (redisMode === "rest") return restCommand<T>(command);
  if (redisMode === "tcp") {
    const client = await getTcpClient();
    if (!isTcpReady(client)) return null;
    try {
      return (await client.call(command[0] as string, ...command.slice(1))) as T;
    } catch {
      return null;
    }
  }
  return null;
}

/** Increment a counter and ensure it expires. Returns count + remaining TTL. */
export async function redisIncr(
  key: string,
  windowSeconds: number
): Promise<{ count: number; ttlSeconds: number } | null> {
  if (redisMode === "rest") {
    const result = await restPipeline<string | number>([
      ["INCR", key],
      ["EXPIRE", key, windowSeconds, "NX"],
      ["TTL", key],
    ]);
    if (!result) return null;

    const count = Number(result[0]);
    if (!Number.isFinite(count)) return null;
    const ttl = Number(result[2]);
    return { count, ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds };
  }

  if (redisMode === "tcp") {
    const client = await getTcpClient();
    if (!isTcpReady(client)) return null;
    try {
      const pipeline = client.multi();
      pipeline.incr(key);
      pipeline.expire(key, windowSeconds, "NX");
      pipeline.ttl(key);
      const result = (await pipeline.exec()) ?? [];
      const count = Number(result[0]?.[1]);
      if (!Number.isFinite(count)) return null;
      const ttl = Number(result[2]?.[1]);
      return { count, ttlSeconds: Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds };
    } catch {
      return null;
    }
  }

  return null;
}

/** Connectivity probe that never exposes credentials or internal URLs. */
export async function redisHealth(): Promise<{
  ok: boolean;
  mode: RedisMode;
  latencyMs: number | null;
}> {
  if (redisMode === "none") return { ok: false, mode: redisMode, latencyMs: null };

  const started = Date.now();
  const result = await redisCommand<string>(["PING"]);
  const latencyMs = Date.now() - started;
  const ok = typeof result === "string" && result.toUpperCase() === "PONG";
  return { ok, mode: redisMode, latencyMs: ok ? latencyMs : null };
}

export async function getCache<T>(key: string): Promise<T | null> {
  if (!isRedisConfigured) return null;
  try {
    const data = await redisCommand<string>(["GET", key]);
    return data ? (JSON.parse(data) as T) : null;
  } catch (error) {
    console.warn("Redis GET error:", error instanceof Error ? error.name : "unknown");
    return null;
  }
}

/** Safe setter with a TTL (default 1 hour). Returns false when unavailable. */
export async function setCache(
  key: string,
  value: unknown,
  ttlSeconds: number = 3600
): Promise<boolean> {
  if (!isRedisConfigured) return false;
  try {
    const result = await redisCommand<string>([
      "SET",
      key,
      JSON.stringify(value),
      "EX",
      Math.max(1, Math.floor(ttlSeconds)),
    ]);
    return result === "OK";
  } catch (error) {
    console.warn("Redis SET error:", error instanceof Error ? error.name : "unknown");
    return false;
  }
}

/** Safe invalidator. Returns false when the key could not be removed. */
export async function invalidateCache(key: string): Promise<boolean> {
  if (!isRedisConfigured) return false;
  try {
    const result = await redisCommand<number>(["DEL", key]);
    return typeof result === "number" && result >= 0;
  } catch (error) {
    console.warn("Redis DEL error:", error instanceof Error ? error.name : "unknown");
    return false;
  }
}
