const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const base = (process.env.AUDIT_BASE_URL || "https://blueeyeentertainment.in").replace(/\/+$/, "");

const publicPages = [
  "/",
  "/about",
  "/contact",
  "/for-artists",
  "/privacy-policy",
  "/terms",
  "/book-artist",
  "/artists",
  "/artists/page/2",
  "/category/singer/mumbai",
  "/city/mumbai",
  "/blog",
  "/events",
  "/events/status/upcoming",
];

const privatePages = [
  "/login",
  "/register",
  "/profile",
  "/reset-password",
  "/switch-account",
  "/admin",
  "/search?q=test",
];

const assets = ["/eye.webp", "/favicon.ico", "/icon-96.webp", "/site.webmanifest"];
const machines = ["/robots.txt", "/sitemap.xml", "/images-sitemap.xml", "/og?title=Audit"];
const probes = ["/.env.local", "/.env", "/wp-login.php", "/xmlrpc.php", "/dashboard", "/wrangler.toml"];

const cacheHeaders = [
  "cache-control",
  "netlify-cdn-cache-control",
  "cdn-cache-control",
  "cf-cache-status",
  "age",
  "vary",
  "content-type",
  "set-cookie",
];

async function request(pathname, headers = {}) {
  const started = Date.now();
  try {
    const response = await fetch(`${base}${pathname}`, {
      headers: {
        "User-Agent": "BlueEyeCacheAudit/1.0 (+diagnostic; bounded requests)",
        ...headers,
      },
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.arrayBuffer();
    return {
      pathname,
      status: response.status,
      location: response.headers.get("location") || "",
      bytes: body.byteLength,
      ms: Date.now() - started,
      headers: Object.fromEntries(
        cacheHeaders.map((name) => [name, response.headers.get(name) || ""])
      ),
    };
  } catch (error) {
    return {
      pathname,
      status: 0,
      location: "",
      bytes: 0,
      ms: Date.now() - started,
      headers: {},
      error: error instanceof Error ? error.message : "request failed",
    };
  }
}

function row(result) {
  const h = result.headers;
  return `| \`${result.pathname}\` | ${result.status} | ${result.ms} | ${result.bytes} | ${h["cache-control"] || "-"} | ${h["cf-cache-status"] || "-"} | ${h.age || "-"} | ${h["netlify-cdn-cache-control"] || "-"} |`;
}

function section(title, results) {
  console.log(`\n### ${title}\n`);
  console.log("| Path | Status | ms | bytes | Cache-Control | CF status | Age | Netlify CDN |");
  console.log("| --- | ---: | ---: | ---: | --- | --- | ---: | --- |");
  for (const result of results) console.log(row(result));
}

console.log(`# Cloudflare/Netlify cache audit\n\nBase: ${base}\nTime: ${new Date().toISOString()}`);
console.log("Bounded diagnostic only; no load or crawler spoofing.");

const publicResults = [];
for (const pathname of publicPages) publicResults.push(await request(pathname));
section("Public pages", publicResults);

const privateResults = [];
for (const pathname of privatePages) privateResults.push(await request(pathname));
section("Private and auth pages", privateResults);

const assetResults = [];
for (const pathname of assets) assetResults.push(await request(pathname));
section("Public static assets", assetResults);

const machineResults = [];
for (const pathname of machines) machineResults.push(await request(pathname));
section("Sitemaps, robots and OG", machineResults);

const probeResults = [];
for (const pathname of probes) probeResults.push(await request(pathname));
section("Scanner probes", probeResults);

const rsc = await request("/", { RSC: "1", Accept: "text/x-component" });
console.log("\n### RSC variant\n");
console.log(row(rsc));
console.log(`Content-Type: \`${rsc.headers["content-type"] || "-"}\``);

const warnings = [];
const sharedWithoutSMaxAge = publicResults.filter(
  (result) => result.status === 200 && !/s-maxage/i.test(result.headers["cache-control"] || "")
);
if (sharedWithoutSMaxAge.length) {
  warnings.push(
    `${sharedWithoutSMaxAge.length} public pages lack s-maxage (expected before this branch is deployed)`
  );
}

const privateCached = privateResults.filter((result) => {
  const value = result.headers["cache-control"] || "";
  return /public|s-maxage/i.test(value) && !/no-store|private/i.test(value);
});
if (privateCached.length) {
  warnings.push(`${privateCached.length} private/auth pages advertise shared caching`);
}

const rscCached = /HIT|REVALIDATED/i.test(rsc.headers["cf-cache-status"] || "");
if (rscCached) {
  warnings.push("RSC response was served from a shared cache; bypass RSC/prefetch");
}

const cfCached = publicResults.filter((result) => /HIT|REVALIDATED/i.test(result.headers["cf-cache-status"] || ""));
if (!cfCached.length) {
  warnings.push("Cloudflare reports no HTML cache HIT/REVALIDATED; a Cache Rule is still required");
}

const scannersAllowed = probeResults.filter((result) => result.status === 200);
if (scannersAllowed.length) {
  warnings.push(`${scannersAllowed.length} scanner probe paths returned 200`);
}

console.log("\n### Warnings\n");
if (!warnings.length) {
  console.log("- none");
} else {
  for (const warning of warnings) console.log(`- ${warning}`);
}

console.log("\n### Manual verification still required\n");
console.log("- Cloudflare Cache Rule bypass for `rsc`, `next-router-state-tree`, `next-router-prefetch`, `next-router-segment-prefetch`, and `_rsc`.");
console.log("- Cloudflare cache rule must exclude `/login`, `/register`, `/reset-password`, `/profile`, `/switch-account`, `/admin*`, `/api/*`, `/search*`, `/my-ticket*`.");
console.log("- Cloudflare analytics 503/500 correlation needs zone logs or Netlify function logs.");

if (strict && warnings.length) process.exitCode = 1;
