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
  let blogEntries: MetadataRoute.Sitemap = [];

  try {
    const { getArtistsForSitemap } = await import("@/lib/services/artistService");
    const { getDistinctCategories, getDistinctCities, getLatestCategoryUpdates, getLatestCityUpdates } = await import(
      "@/lib/services/searchService"
    );
    const { getEventsForSitemap } = await import("@/lib/services/eventService");
    const { getBlogPostsForSitemap } = await import("@/lib/services/blogService");

    type SitemapEntry = { slug: string; updatedAt?: string };

    const [artists, categories, cities, events, blogPosts, catUpdates, cityUpdates] = await Promise.all([
      getArtistsForSitemap().catch(() => [] as SitemapEntry[]),
      getDistinctCategories().catch(() => [] as string[]),
      getDistinctCities().catch(() => [] as string[]),
      getEventsForSitemap().catch(() => [] as SitemapEntry[]),
      getBlogPostsForSitemap().catch(() => [] as SitemapEntry[]),
      getLatestCategoryUpdates().catch(() => [] as { category: string; updatedAt: Date }[]),
      getLatestCityUpdates().catch(() => [] as { city: string; updatedAt: Date }[]),
    ]);

    const categoryUpdateMap = new Map(catUpdates.map((c: { category: string; updatedAt: Date }) => [c.category.toLowerCase(), c.updatedAt]));
    const cityUpdateMap = new Map(cityUpdates.map((c: { city: string; updatedAt: Date }) => [c.city.toLowerCase(), c.updatedAt]));

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
          lastModified: categoryUpdateMap.get(category.toLowerCase()) || undefined,
        })
      );

    cityEntries = cities
      .filter(Boolean)
      .map((city: string) =>
        entry(cityPath(city), {
          priority: 0.75,
          changeFrequency: "weekly",
          lastModified: cityUpdateMap.get(city.toLowerCase()) || undefined,
        })
      );

    eventEntries = events.map((event: SitemapEntry) =>
      entry(`/events/${event.slug}`, {
        priority: 0.8,
        changeFrequency: "weekly",
        lastModified: event.updatedAt ? new Date(event.updatedAt) : undefined,
      })
    );

    blogEntries = [
      entry("/blog", { priority: 0.7, changeFrequency: "daily" }),
      ...blogPosts.map((post: SitemapEntry) =>
        entry(`/blog/${post.slug}`, {
          priority: 0.7,
          changeFrequency: "monthly",
          lastModified: post.updatedAt ? new Date(post.updatedAt) : undefined,
        })
      ),
    ];
  } catch (error) {
    console.error("Sitemap: failed to fetch dynamic routes:", error);
  }

  return [
    ...staticEntries,
    ...categoryEntries,
    ...cityEntries,
    ...artistEntries,
    ...eventEntries,
    ...blogEntries,
  ];
}
