import type { Metadata } from "next";
import { getArtists } from "@/lib/services/artistService";
export const revalidate = 3600;

import { getDistinctCategories, getDistinctCities } from "@/lib/services/searchService";
import ArtistCard from "@/components/ui/ArtistCard";
import ArtistFilterBar from "@/components/ui/ArtistFilterBar";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { categoryPath, resolveCategorySlug } from "@/lib/seo/slugs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getDistinctCategories();
  const label = resolveCategorySlug(category, categories);
  return pageMetadata({
    title: `${label} Artists for Hire — Weddings, Corporate & Events in India`,
    description: `Browse and book verified ${label.toLowerCase()} artists for weddings, corporate events, and private parties across India on ${siteConfig.name}.`,
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
  const [{ category }, sParams, categories, cities] = await Promise.all([
    params,
    searchParams,
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



  const structuredData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Artists", path: "/artists" },
    { name: decodedCategory, path: canonicalPath },
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
        <span>{decodedCategory}</span>
      </div>
      <div className="artists-header">
        <div>
          <div className="section-label">Category</div>
          <h1 className="section-title">
            Hire <span>{decodedCategory}</span> Artists
          </h1>
          <p className="section-desc">
            Book verified {decodedCategory.toLowerCase()} performers for weddings, corporate
            events, and private parties across India. Browse {total} {decodedCategory.toLowerCase()} artists
            and connect directly with top talent.
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
          />
        ))}
      </div>

      {/* Explore Related Categories (Internal Linking SEO) */}
      {categories.length > 1 && (
        <div style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text)", fontFamily: "var(--font-primary)" }}>
            Explore Other Entertainment Categories
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {categories
              .filter((c) => c.toLowerCase() !== decodedCategory.toLowerCase())
              .map((c) => (
                <a
                  key={c}
                  href={categoryPath(c)}
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
                  Hire {c}s ↗
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
