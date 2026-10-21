import { existsSync, readFileSync } from "node:fs";

function loadLocalEnv() {
  if (!existsSync(".env.local")) return;
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadLocalEnv();

const base = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/+$/, "");
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!base || !token) {
  console.log("SKIP Redis integration: UPSTASH_REDIS_REST_URL/TOKEN not configured.");
  process.exit(0);
}

async function command(...parts) {
  const response = await fetch(
    `${base}/${parts.map((part) => encodeURIComponent(String(part))).join("/")}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    }
  );
  if (!response.ok) {
    throw new Error(`Upstash REST returned HTTP ${response.status}`);
  }
  const payload = await response.json();
  if (payload.error) throw new Error(`Upstash REST error: ${payload.error}`);
  return payload.result;
}

const key = `blueeye:diagnostics:${Date.now()}`;
let failures = 0;

function check(name, actual, expected) {
  if (actual === expected) {
    console.log(`PASS ${name}`);
    return;
  }
  failures += 1;
  console.error(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

try {
  check("PING", await command("PING"), "PONG");
  check("SET", await command("SET", key, "ok", "EX", 30), "OK");
  check("GET", await command("GET", key), "ok");
  check("INCR", await command("INCR", `${key}:count`), 1);
  check("EXPIRE NX", await command("EXPIRE", `${key}:count`, 30, "NX"), 1);
  const ttl = await command("TTL", `${key}:count`);
  check("TTL is bounded", ttl > 0 && ttl <= 30, true);
  await command("DEL", key, `${key}:count`);
  console.log("Redis integration OK (REST reachable, TTL/INCR available).");
} catch (error) {
  failures += 1;
  console.error(`FAIL Redis integration: ${error instanceof Error ? error.message : "unknown error"}`);
}

process.exitCode = failures ? 1 : 0;
