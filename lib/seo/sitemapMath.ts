export const SITEMAP_SHARD_SIZE = 1000;

/** Protocol-safety cap, not a catalog-size cap. */
export const MAX_ARTIST_URLS = 50_000;

export function getArtistShardCount(
  artistCount: number,
  shardSize = SITEMAP_SHARD_SIZE,
  maxUrls = MAX_ARTIST_URLS
): number {
  const safeCount = Number.isFinite(artistCount) ? Math.max(0, Math.floor(artistCount)) : 0;
  return Math.max(1, Math.ceil(Math.min(safeCount, maxUrls) / shardSize));
}

export function getArtistShardBounds(
  shardNumber: number,
  shardSize = SITEMAP_SHARD_SIZE,
  maxUrls = MAX_ARTIST_URLS
): { skip: number; limit: number } | null {
  if (!Number.isInteger(shardNumber) || shardNumber < 1) return null;
  const skip = (shardNumber - 1) * shardSize;
  if (skip >= maxUrls) return null;
  return { skip, limit: Math.min(shardSize, maxUrls - skip) };
}
