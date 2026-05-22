import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";
import { categoryPath, cityPath } from "@/lib/seo/slugs";

export const revalidate = 3600;

function entry(
  path: string,
  options: {
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    lastModified?: Date;
  }
): MetadataRoute.Sitemap[number] {
  const item: MetadataRoute.Sitemap[number] = {
    url: siteUrl(path),
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  };
  if (options.lastModified) {
    item.lastModified = options.lastModified;
  }
  return item;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    entry("/", { priority: 1, changeFrequency: "daily" }),
    entry("/artists", { priority: 0.9, changeFrequency: "daily" }),
    entry("/events", { priority: 0.85, changeFrequency: "daily" }),
    entry("/book-artist", { priority: 0.8, changeFrequency: "monthly" }),
    entry("/about", { priority: 0.7, changeFrequency: "monthly" }),
    entry("/contact", { priority: 0.7, changeFrequency: "monthly" }),
  ];

  let artistEntries: MetadataRoute.Sitemap = [];
  let categoryEntries: MetadataRoute.Sitemap = [];
  let cityEntries: MetadataRoute.Sitemap = [];
  let eventEntries: MetadataRoute.Sitemap = [];

  try {
    const { getArtistsForSitemap } = await import("@/lib/services/artistService");
    const { getDistinctCategories, getDistinctCities } = await import(
      "@/lib/services/searchService"
    );
    const { getEventsForSitemap } = await import("@/lib/services/eventService");

    type SitemapEntry = { slug: string; updatedAt?: string };

    const [artists, categories, cities, events] = await Promise.all([
      getArtistsForSitemap().catch(() => [] as SitemapEntry[]),
      getDistinctCategories().catch(() => [] as string[]),
      getDistinctCities().catch(() => [] as string[]),
      getEventsForSitemap().catch(() => [] as SitemapEntry[]),
    ]);

    artistEntries = artists.map((artist: SitemapEntry) =>
      entry(`/artists/${artist.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: artist.updatedAt ? new Date(artist.updatedAt) : undefined,
      })
    );

    categoryEntries = categories
      .filter(Boolean)
      .map((category: string) =>
        entry(categoryPath(category), {
          priority: 0.75,
          changeFrequency: "weekly",
        })
      );

    cityEntries = cities
      .filter(Boolean)
      .map((city: string) =>
        entry(cityPath(city), {
          priority: 0.75,
          changeFrequency: "weekly",
        })
      );

    eventEntries = events.map((event: SitemapEntry) =>
      entry(`/events/${event.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: event.updatedAt ? new Date(event.updatedAt) : undefined,
      })
    );
  } catch (error) {
    console.error("Sitemap: failed to fetch dynamic routes:", error);
  }

  return [
    ...staticEntries,
    ...categoryEntries,
    ...cityEntries,
    ...artistEntries,
    ...eventEntries,
  ];
}
