import type { Metadata } from "next";
import { getArtists } from "@/lib/services/artistService";
export const dynamic = "force-dynamic";

import { getUserFavorites } from "@/lib/services/userService";
import { getDistinctCities } from "@/lib/services/searchService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import ArtistCard from "@/components/ui/ArtistCard";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { cityPath, resolveCitySlug } from "@/lib/seo/slugs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cities = await getDistinctCities();
  const label = resolveCitySlug(city, cities);
  return pageMetadata({
    title: `Artists in ${label}`,
    description: `Find and book performers available in ${label} for weddings, corporate events, and private parties on ${siteConfig.name}.`,
    path: cityPath(label),
  });
}

export default async function CityArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const [{ city }, sParams, session, cities] = await Promise.all([
    params,
    searchParams,
    getServerSession(authOptions),
    getDistinctCities(),
  ]);

  const decodedCity = resolveCitySlug(city, cities);

  const { artists, total } = (await getArtists({
    city: decodedCity,
    q: sParams.q,
    category: sParams.category,
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
          <div className="section-label">Location</div>
          <h1 className="section-title">
            Artists in <span>{decodedCity}</span>
          </h1>
          <p className="section-desc">
            Discover and book live performers based in {decodedCity} for events across India.
            Showing {artists.length} of {total} available artists.
          </p>
        </div>
      </div>

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
