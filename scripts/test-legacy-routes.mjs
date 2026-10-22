import test from "node:test";
import assert from "node:assert/strict";
import { legacyRedirectPath } from "../lib/seo/legacyRoutes.ts";

function redirect(path, query = "") {
  return legacyRedirectPath(path, new URLSearchParams(query));
}

test("requests without legacy query parameters are untouched", () => {
  assert.equal(redirect("/artists"), null);
  assert.equal(redirect("/artists", "utm_source=x"), null);
});

test("artist query listings map to static routes", () => {
  assert.equal(redirect("/artists", "page=2"), "/artists/page/2");
  assert.equal(
    redirect("/artists", "category=Singer&city=Mumbai&page=2"),
    "/category/singer/mumbai/page/2"
  );
  assert.equal(redirect("/artists", "city=Mumbai"), "/city/mumbai");
});

test("blog and event query filters map to static routes", () => {
  assert.equal(redirect("/blog", "page=2"), "/blog/page/2");
  assert.equal(redirect("/events", "status=upcoming"), "/events/status/upcoming");
  assert.equal(redirect("/blog/category/News", "page=2"), "/blog/category/news/page/2");
});

test("path pagination is preserved", () => {
  assert.equal(redirect("/city/mumbai", "page=2"), "/city/mumbai/page/2");
  assert.equal(redirect("/category/singer", "page=3"), "/category/singer/page/3");
  assert.equal(redirect("/category/singer/page/2", "page=3"), null);
});

test("invalid or malformed values do not throw", () => {
  assert.equal(redirect("/artists", "page=abc"), "/artists");
  assert.equal(redirect("/artists", "category=100%25"), "/category/100");
  assert.equal(redirect("/events", "status="), null);
});
