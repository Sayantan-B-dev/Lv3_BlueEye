import type { Metadata } from "next";
import { getArtists } from "@/lib/services/artistService";
export const dynamic = "force-dynamic";

import { getUserFavorites } from "@/lib/services/userService";
import { getDistinctCategories, getDistinctCities } from "@/lib/services/searchService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import ArtistCard from "@/components/ui/ArtistCard";
import ArtistFilterBar from "@/components/ui/ArtistFilterBar";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { categoryPath, resolveCategorySlug } from "@/lib/seo/slugs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getDistinctCategories();
  const label = resolveCategorySlug(category, categories);
  return pageMetadata({
    title: `${label} Artists`,
    description: `Browse and book ${label.toLowerCase()} artists for weddings, corporate events, and private parties across India on ${siteConfig.name}.`,
    path: categoryPath(label),
  });
}

export default async function CategoryArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const [{ category }, sParams, session, categories, cities] = await Promise.all([
    params,
    searchParams,
    getServerSession(authOptions),
    getDistinctCategories(),
    getDistinctCities(),
  ]);

  const decodedCategory = resolveCategorySlug(category, categories);
  const canonicalPath = categoryPath(decodedCategory);

  const { artists, total } = (await getArtists({
    category: decodedCategory,
    q: sParams.q,
    city: sParams.city,
    limit: 100,
  })) as { artists: any[]; total: number };

  const favorites = session?.user ? await getUserFavorites((session.user as any).id) : [];

  return (
    <div
      className="section-inner"
      style={{
        padding: "clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)",
        paddingTop: "calc(var(--hdr-h) + 2rem)",
      }}
    >
      <div className="artists-header">
        <div>
          <div className="section-label">Category</div>
          <h1 className="section-title">
            <span>{decodedCategory}</span> Artists
          </h1>
          <p className="section-desc">
            Book verified {decodedCategory.toLowerCase()} performers for weddings, corporate
            events, and private parties across India. Showing {artists.length} of {total}{" "}
            artists in this category.
          </p>
        </div>
      </div>

      <ArtistFilterBar categories={categories} cities={cities} basePath={canonicalPath} />

      <div className="artists-grid">
        {artists.map((artist, i) => (
          <ArtistCard
            key={artist.slug}
            artist={artist}
            index={i}
            initialIsFavorite={favorites.includes(artist._id.toString())}
          />
        ))}
      </div>
    </div>
  );
}
