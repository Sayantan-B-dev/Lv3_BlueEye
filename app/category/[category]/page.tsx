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
import { categorySeoContent, categoryMetaDescription } from "@/lib/seo/content";

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
    description: categoryMetaDescription(label),
    path: categoryPath(label),
  });
}

const PAGE_SIZE = 24;

export default async function CategoryArtistsPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ q?: string; city?: string; page?: string }>;
}) {
  const [{ category }, sParams, categories, cities] = await Promise.all([
    params,
    searchParams,
    getDistinctCategories(),
    getDistinctCities(),
  ]);

  const decodedCategory = resolveCategorySlug(category, categories);
  const canonicalPath = categoryPath(decodedCategory);
  const currentPage = Math.max(1, parseInt(sParams.page || "1", 10));

  const { artists, total } = (await getArtists({
    category: decodedCategory,
    q: sParams.q,
    city: sParams.city,
    page: currentPage,
    limit: PAGE_SIZE,
  })) as { artists: any[]; total: number };

  const totalPages = Math.ceil(total / PAGE_SIZE);



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
              href={`${canonicalPath}?page=${currentPage - 1}${sParams.q ? `&q=${encodeURIComponent(sParams.q)}` : ""}${sParams.city ? `&city=${encodeURIComponent(sParams.city)}` : ""}`}
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
            const href = pageNum === 1 ? canonicalPath : `${canonicalPath}?page=${pageNum}${sParams.q ? `&q=${encodeURIComponent(sParams.q)}` : ""}${sParams.city ? `&city=${encodeURIComponent(sParams.city)}` : ""}`;
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
              href={`${canonicalPath}?page=${currentPage + 1}${sParams.q ? `&q=${encodeURIComponent(sParams.q)}` : ""}${sParams.city ? `&city=${encodeURIComponent(sParams.city)}` : ""}`}
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
          Why Hire {decodedCategory} Artists on {siteConfig.name}
        </h2>
        <div style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "900px" }}>
          {categorySeoContent(decodedCategory, total).split("\n\n").map((paragraph, i) => (
            <p key={i} style={{ marginBottom: "1rem" }}>{paragraph}</p>
          ))}
        </div>
      </section>

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
