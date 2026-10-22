import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_ARTIST_URLS,
  SITEMAP_SHARD_SIZE,
  getArtistShardBounds,
  getArtistShardCount,
} from "../lib/seo/sitemapMath.ts";

test("10,588 artists produce 11 artist shards", () => {
  assert.equal(getArtistShardCount(10_588), 11);
});

test("shard size remains 1,000 and empty catalogs still expose one shard", () => {
  assert.equal(SITEMAP_SHARD_SIZE, 1000);
  assert.equal(getArtistShardCount(0), 1);
  assert.equal(getArtistShardCount(1000), 1);
  assert.equal(getArtistShardCount(1001), 2);
});

test("shard bounds cover the catalog without overlapping", () => {
  const last = getArtistShardBounds(11);
  assert.deepEqual(last, { skip: 10_000, limit: 1_000 });
  assert.deepEqual(getArtistShardBounds(1), { skip: 0, limit: 1_000 });
});

test("the safety cap is 50,000 URLs, not 5,000", () => {
  assert.equal(MAX_ARTIST_URLS, 50_000);
  assert.equal(getArtistShardCount(60_000), 50);
  assert.equal(getArtistShardBounds(51), null);
});
