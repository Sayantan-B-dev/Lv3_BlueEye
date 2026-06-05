import type { Metadata } from "next";
import { getArtists } from "@/lib/services/artistService";
export const revalidate = 3600;

import { getDistinctCities } from "@/lib/services/searchService";
import ArtistCard from "@/components/ui/ArtistCard";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { cityPath, resolveCitySlug } from "@/lib/seo/slugs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { citySeoContent, cityMetaDescription } from "@/lib/seo/content";

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
    description: cityMetaDescription(label),
    path: cityPath(label),
    ogType: "city",
  });
}

const PAGE_SIZE = 24;

export default async function CityArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const [{ city }, sParams, cities] = await Promise.all([
    params,
    searchParams,
    getDistinctCities(),
  ]);

  const decodedCity = resolveCitySlug(city, cities);
  const canonicalPath = cityPath(decodedCity);
  const currentPage = Math.max(1, parseInt(sParams.page || "1", 10));

  const { artists, total } = (await getArtists({
    city: decodedCity,
    q: sParams.q,
    category: sParams.category,
    page: currentPage,
    limit: PAGE_SIZE,
  })) as { artists: any[]; total: number };

  const totalPages = Math.ceil(total / PAGE_SIZE);



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
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Artist pages"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.5rem",
            marginTop: "3rem",
            flexWrap: "wrap",
          }}
        >
          {currentPage > 1 && (
            <Link
              href={`${canonicalPath}?page=${currentPage - 1}${sParams.q ? `&q=${encodeURIComponent(sParams.q)}` : ""}${sParams.category ? `&category=${encodeURIComponent(sParams.category)}` : ""}`}
              className="btn-outline"
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none" }}
            >
              ← Prev
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const startPage = Math.max(1, currentPage - 4);
            const pageNum = startPage + i;
            if (pageNum > totalPages) return null;
            const href = pageNum === 1 ? canonicalPath : `${canonicalPath}?page=${pageNum}${sParams.q ? `&q=${encodeURIComponent(sParams.q)}` : ""}${sParams.category ? `&category=${encodeURIComponent(sParams.category)}` : ""}`;
            return (
              <Link
                key={pageNum}
                href={href}
                className="btn-outline"
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: pageNum === currentPage ? 800 : 500,
                  background: pageNum === currentPage ? "var(--gold)" : "transparent",
                  color: pageNum === currentPage ? "#000" : "var(--text)",
                  borderColor: pageNum === currentPage ? "var(--gold)" : "var(--border)",
                }}
              >
                {pageNum}
              </Link>
            );
          })}
          {currentPage < totalPages && (
            <Link
              href={`${canonicalPath}?page=${currentPage + 1}${sParams.q ? `&q=${encodeURIComponent(sParams.q)}` : ""}${sParams.category ? `&category=${encodeURIComponent(sParams.category)}` : ""}`}
              className="btn-outline"
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none" }}
            >
              Next →
            </Link>
          )}
        </nav>
      )}

      {/* SEO Content Section */}
      <section style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
        <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text)", fontFamily: "var(--font-primary)" }}>
          Book Artists in {decodedCity} — Premium Entertainment
        </h2>
        <div style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "900px" }}>
          {citySeoContent(decodedCity, total).split("\n\n").map((paragraph, i) => (
            <p key={i} style={{ marginBottom: "1rem" }}>{paragraph}</p>
          ))}
        </div>
      </section>

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
