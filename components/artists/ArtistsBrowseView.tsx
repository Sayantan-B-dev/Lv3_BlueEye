import { Suspense } from "react";
import { getArtists } from "@/lib/services/artistService";
import { getDistinctCategories, getDistinctCities } from "@/lib/services/searchService";
import Link from "next/link";
import ArtistCard from "@/components/ui/ArtistCard";
import ArtistFilterBar from "@/components/ui/ArtistFilterBar";
import { siteConfig } from "@/lib/config/site";
import { artistPagePath } from "@/lib/seo/slugs";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const ARTISTS_PAGE_SIZE = 24;

type ArtistRow = { slug: string; [key: string]: unknown };

export default async function ArtistsBrowseView({ page }: { page: number }) {
  const [categories, cities, result] = await Promise.all([
    getDistinctCategories(),
    getDistinctCities(),
    getArtists({ page, limit: ARTISTS_PAGE_SIZE }),
  ]);

  const { artists, totalPages, total } = result as {
    artists: ArtistRow[];
    totalPages: number;
    total: number;
  };

  const structuredData = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Artists", path: "/artists" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Browse Artists — Singers, DJs, Comedians",
      description: `Discover and book verified performers across India on ${siteConfig.name}.`,
      numberOfItems: total,
      itemListElement: artists.slice(0, 20).map((a: ArtistRow, i: number) => ({
        "@type": "ListItem",
        position: i + 1 + (page - 1) * ARTISTS_PAGE_SIZE,
        url: `${siteConfig.url}/artists/${a.slug}`,
      })),
    },
  ];

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
      <div className="artists-header">
        <div>
          <div className="section-label">Browse All</div>
          <h1 className="section-title">
            India&apos;s Top <span>Artists</span>
          </h1>
          <p className="section-desc">
            Showing {artists.length} of {total} verified performers
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="filter-bar" style={{ minHeight: 72 }} />}>
        <ArtistFilterBar categories={categories} cities={cities} />
      </Suspense>

      <div className="artists-grid">
        {artists.map((artist, i) => (
          <ArtistCard key={artist.slug} artist={artist} index={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginTop: "3rem" }}>
          {page > 1 && (
            <Link href={artistPagePath(page - 1)} prefetch={false} className="btn-outline" rel="prev">
              ← Previous
            </Link>
          )}
          <span style={{ display: "flex", alignItems: "center" }}>
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={artistPagePath(page + 1)} prefetch={false} className="btn-outline" rel="next">
              Next →
            </Link>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
          <h2
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
              fontWeight: 800,
              marginBottom: "1.25rem",
              color: "var(--text)",
              fontFamily: "var(--font-primary)",
            }}
          >
            Browse Artists by Category
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2rem" }}>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/search?category=${encodeURIComponent(c)}`}
                prefetch={false}
                className="btn-outline"
                style={{
                  padding: "0.5rem 1.25rem",
                  fontSize: "0.82rem",
                  borderRadius: "100px",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                {c} Artists ↗
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
