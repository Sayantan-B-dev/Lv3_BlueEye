import assert from "node:assert/strict";
import test from "node:test";
import {
  PRIVATE_CACHE_CONTROL,
  PRIVATE_HTML_SOURCES,
  SHARED_HTML_CACHE_CONTROL,
  SHARED_HTML_NETLIFY_CACHE_CONTROL,
  SHARED_HTML_SOURCES,
  isPrivatePath,
  isRscRequest,
  isSharedHtmlPath,
} from "../lib/cache/publicRoutes.ts";

test("public informational and listing routes are shared-cacheable", () => {
  for (const path of [
    "/",
    "/about",
    "/contact",
    "/for-artists",
    "/privacy-policy",
    "/terms",
    "/book-artist",
    "/categories",
    "/artists",
    "/artists/arjun",
    "/artists/page/2",
    "/city/mumbai",
    "/category/singer",
    "/category/singer/mumbai",
    "/category/singer/mumbai/page/2",
    "/blog",
    "/blog/post",
    "/events",
    "/events/status/upcoming",
  ]) {
    assert.equal(isSharedHtmlPath(path), true, path);
  }
});

test("query strings and trailing slashes do not change cache classification", () => {
  assert.equal(isSharedHtmlPath("/artists/?utm_source=test"), true);
  assert.equal(isSharedHtmlPath("/about/"), true);
  assert.equal(isSharedHtmlPath("/login/?callbackUrl=%2Fadmin"), false);
});

test("auth, admin, API, search and ticket routes are never shared-cacheable", () => {
  for (const path of [
    "/login",
    "/register",
    "/reset-password",
    "/profile",
    "/switch-account",
    "/admin",
    "/admin/login",
    "/admin/ticketing/checkin",
    "/api/health/db",
    "/search",
    "/my-ticket/abc",
  ]) {
    assert.equal(isSharedHtmlPath(path), false, path);
    assert.equal(isPrivatePath(path), true, path);
  }
});

test("private source list does not overlap shared HTML sources", () => {
  for (const source of PRIVATE_HTML_SOURCES) {
    const concrete = source.replace(":path*", "test");
    assert.equal(isSharedHtmlPath(concrete), false, source);
  }
});

test("shared source list contains the expected public surfaces", () => {
  for (const source of ["/", "/blog/:path*", "/events/:path*", "/city/:path*", "/category/:path*"]) {
    assert.ok(SHARED_HTML_SOURCES.includes(source), source);
  }
});

test("shared and private cache directives encode the intended policy", () => {
  assert.match(SHARED_HTML_CACHE_CONTROL, /s-maxage=3600/);
  assert.match(SHARED_HTML_CACHE_CONTROL, /stale-while-revalidate=86400/);
  assert.match(SHARED_HTML_NETLIFY_CACHE_CONTROL, /public/);
  assert.match(PRIVATE_CACHE_CONTROL, /private/);
  assert.match(PRIVATE_CACHE_CONTROL, /no-store/);
});

test("RSC and prefetch requests are detected", () => {
  assert.equal(isRscRequest(new Headers({ rsc: "1" })), true);
  assert.equal(isRscRequest(new Headers({ "next-router-prefetch": "1" })), true);
  assert.equal(isRscRequest(new Headers({ "next-router-segment-prefetch": "/" })), true);
  assert.equal(isRscRequest(new Headers({ accept: "text/x-component" })), true);
  assert.equal(isRscRequest(new Headers({ accept: "text/html" })), false);
});
