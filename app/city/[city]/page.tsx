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
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cities = await getDistinctCities();
  const label = resolveCitySlug(city, cities);
  return pageMetadata({
    title: `Book Artists in ${label} — Singers, DJs & Performers for Events`,
    description: `Find and book top performers available in ${label} for weddings, corporate events, and private parties on ${siteConfig.name}.`,
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

  const structuredData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Artists", path: "/artists" },
    { name: decodedCity, path: cityPath(decodedCity) },
  ]);

  return (
    <div
      className="section-inner"
      style={{
        padding: "clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)",
        paddingTop: "calc(var(--hdr-h) + 2rem)",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--muted,#9ca3af)",
          display: "flex",
          gap: "0.4rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          Home
        </Link>
        <span>/</span>
        <Link href="/artists" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          Artists
        </Link>
        <span>/</span>
        <span>{decodedCity}</span>
      </div>
      <div className="artists-header">
        <div>
          <div className="section-label">Location</div>
          <h1 className="section-title">
            Book Artists in <span>{decodedCity}</span>
          </h1>
          <p className="section-desc">
            Discover and book live performers based in {decodedCity} for weddings, corporate events,
            and private parties across India. Browse {total} verified artists available in {decodedCity}.
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

      {/* Explore Other Cities (Internal Linking SEO) */}
      {cities.length > 1 && (
        <div style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text)", fontFamily: "var(--font-primary)" }}>
            Explore Performers in Other Cities
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {cities
              .filter((c) => c.toLowerCase() !== decodedCity.toLowerCase())
              .map((c) => (
                <a
                  key={c}
                  href={cityPath(c)}
                  className="btn-outline"
                  style={{
                    padding: "0.5rem 1.25rem",
                    fontSize: "0.82rem",
                    borderRadius: "100px",
                    textDecoration: "none",
                    fontWeight: 700,
                    textTransform: "capitalize",
                  }}
                >
                  Artists in {c} ↗
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
