import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";
import { categoryPath, cityPath } from "@/lib/seo/slugs";
import { slugify } from "@/lib/utils/slugify";
import {
  countArtistsForSitemap,
  getArtistsForSitemapRange,
} from "@/lib/services/artistService";

export const SITEMAP_SHARD_SIZE = 1000;
export const MAX_ARTIST_URLS = 5000;
// Avoid advertising thin category/city landing pages as SEO targets.
export const MIN_CATEGORY_CITY_ARTISTS = 5;

type Entry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  options: {
    priority: number;
    changeFrequency: Entry["changeFrequency"];
    lastModified?: Date;
  }
): Entry {
  const item: Entry = {
    url: siteUrl(path),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  };
  if (options.lastModified) item.lastModified = options.lastModified;
  return item;
}

/** Stable shard identifiers — "pages" plus one shard per 1,000 artists. */
export async function getSitemapShardIds(): Promise<string[]> {
  let artistCount = 0;
  try {
    artistCount = await countArtistsForSitemap(MAX_ARTIST_URLS);
  } catch {
    artistCount = 0;
  }

  const artistShards = Math.max(1, Math.ceil(artistCount / SITEMAP_SHARD_SIZE));
  return ["pages", ...Array.from({ length: artistShards }, (_, i) => `artists-${i + 1}`)];
}

async function getPagesShard(): Promise<Entry[]> {
  const entries: Entry[] = [
    entry("/", { priority: 1, changeFrequency: "daily" }),
    entry("/artists", { priority: 0.9, changeFrequency: "daily" }),
    entry("/events", { priority: 0.85, changeFrequency: "daily" }),
    entry("/book-artist", { priority: 0.8, changeFrequency: "monthly" }),
    entry("/about", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/contact", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/blog", { priority: 0.7, changeFrequency: "daily" }),
  ];

  try {
    const { getDistinctCategories, getDistinctCities, getLatestCategoryUpdates, getLatestCityUpdates, getCategoryCityCounts } =
      await import("@/lib/services/searchService");
    const { getEventsForSitemap } = await import("@/lib/services/eventService");
    const { getBlogPostsForSitemap } = await import("@/lib/services/blogService");

    type SitemapRow = { slug: string; updatedAt?: string };

    const [categories, cities, events, blogPosts, catUpdates, cityUpdates, combos] =
      await Promise.all([
        getDistinctCategories().catch(() => [] as string[]),
        getDistinctCities().catch(() => [] as string[]),
        getEventsForSitemap().catch(() => [] as SitemapRow[]),
        getBlogPostsForSitemap().catch(() => [] as SitemapRow[]),
        getLatestCategoryUpdates().catch(() => [] as { category: string; updatedAt: Date }[]),
        getLatestCityUpdates().catch(() => [] as { city: string; updatedAt: Date }[]),
        getCategoryCityCounts(MIN_CATEGORY_CITY_ARTISTS).catch(() => [] as { category: string; city: string; count: number }[]),
      ]);

    const categoryUpdateMap = new Map(
      catUpdates.map((c) => [c.category.toLowerCase(), c.updatedAt])
    );
    const cityUpdateMap = new Map(cityUpdates.map((c) => [c.city.toLowerCase(), c.updatedAt]));

    for (const category of categories.filter(Boolean)) {
      entries.push(
        entry(categoryPath(category), {
          priority: 0.75,
          changeFrequency: "weekly",
          lastModified: categoryUpdateMap.get(category.toLowerCase()) || undefined,
        })
      );
    }

    for (const city of cities.filter(Boolean)) {
      entries.push(
        entry(cityPath(city), {
          priority: 0.75,
          changeFrequency: "weekly",
          lastModified: cityUpdateMap.get(city.toLowerCase()) || undefined,
        })
      );
    }

    for (const combo of combos.filter(Boolean)) {
      entries.push(
        entry(`/category/${slugify(combo.category)}/${slugify(combo.city)}`, {
          priority: 0.7,
          changeFrequency: "weekly",
        })
      );
    }

    for (const event of events) {
      entries.push(
        entry(`/events/${event.slug}`, {
          priority: 0.8,
          changeFrequency: "weekly",
          lastModified: event.updatedAt ? new Date(event.updatedAt) : undefined,
        })
      );
    }

    for (const post of blogPosts) {
      entries.push(
        entry(`/blog/${post.slug}`, {
          priority: 0.7,
          changeFrequency: "monthly",
          lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
        })
      );
    }
  } catch (error) {
    console.error("Sitemap: failed to build pages shard", error instanceof Error ? error.message : "");
  }

  return dedupe(entries);
}

async function getArtistShard(shardNumber: number): Promise<Entry[]> {
  const skip = (shardNumber - 1) * SITEMAP_SHARD_SIZE;
  if (skip >= MAX_ARTIST_URLS) return [];

  try {
    const artists = await getArtistsForSitemapRange(
      skip,
      Math.min(SITEMAP_SHARD_SIZE, MAX_ARTIST_URLS - skip)
    );
    return artists.map((artist) =>
      entry(`/artists/${artist.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: artist.updatedAt ? new Date(artist.updatedAt) : undefined,
      })
    );
  } catch (error) {
    console.error("Sitemap: failed to build artist shard", error instanceof Error ? error.message : "");
    return [];
  }
}

export async function getSitemapShard(id: string): Promise<Entry[]> {
  if (id === "pages") return getPagesShard();

  const match = /^artists-(\\d+)$/.exec(id);
  if (!match) return [];
  return getArtistShard(Number.parseInt(match[1], 10));
}

function dedupe(entries: Entry[]): Entry[] {
  const seen = new Set<string>();
  return entries.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}
