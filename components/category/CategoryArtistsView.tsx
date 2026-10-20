import { Suspense } from "react";
import { getArtists } from "@/lib/services/artistService";
import { getDistinctCategories, getDistinctCities } from "@/lib/services/searchService";
import ArtistCard from "@/components/ui/ArtistCard";
import ArtistFilterBar from "@/components/ui/ArtistFilterBar";
import { siteConfig } from "@/lib/config/site";
import { categoryPagePath, categoryPath } from "@/lib/seo/slugs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { categorySeoContent, pluralizeCategory } from "@/lib/seo/content";

export const CATEGORY_PAGE_SIZE = 24;

type ArtistRow = { slug: string; [key: string]: unknown };

export default async function CategoryArtistsView({
  category,
  page,
}: {
  category: string;
  page: number;
}) {
  const [categories, cities, result] = await Promise.all([
    getDistinctCategories(),
    getDistinctCities(),
    getArtists({ category, page, limit: CATEGORY_PAGE_SIZE }),
  ]);

  const { artists, total } = result as { artists: ArtistRow[]; total: number };
  const totalPages = Math.ceil(total / CATEGORY_PAGE_SIZE);
  const canonicalPath = categoryPath(category);

  const structuredData = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Artists", path: "/artists" },
      { name: category, path: canonicalPath },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category} Artists for Hire`,
      description: `Book verified ${category.toLowerCase()} performers for weddings, corporate events, and parties in India.`,
      numberOfItems: total,
      itemListElement: artists.slice(0, 20).map((a: ArtistRow, i: number) => ({
        "@type": "ListItem",
        position: i + 1 + (page - 1) * CATEGORY_PAGE_SIZE,
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
      <nav
        aria-label="Breadcrumb"
        style={{
          fontSize: "0.8rem",
          color: "var(--muted,#9ca3af)",
          display: "flex",
          gap: "0.4rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/" prefetch={false} style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          Home
        </Link>
        <span>/</span>
        <Link href="/artists" prefetch={false} style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          Artists
        </Link>
        <span>/</span>
        <span>{category}</span>
      </nav>
      <div className="artists-header">
        <div>
          <div className="section-label">Category</div>
          <h1 className="section-title">
            Hire <span>{category}</span> Artists
          </h1>
          <p className="section-desc">
            Book verified {category.toLowerCase()} performers for weddings, corporate events, and
            private parties across India. Browse {total} {category.toLowerCase()} artists and
            connect directly with top talent.
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
          {page > 1 && (
            <Link
              href={categoryPagePath(category, page - 1)}
              prefetch={false}
              className="btn-outline"
              rel="prev"
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none" }}
            >
              ← Prev
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const startPage = Math.max(1, page - 4);
            const pageNum = startPage + i;
            if (pageNum > totalPages) return null;
            return (
              <Link
                key={pageNum}
                href={categoryPagePath(category, pageNum)}
                prefetch={false}
                className="btn-outline"
                style={{
                  padding: "0.5rem 0.9rem",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: pageNum === page ? 800 : 500,
                  background: pageNum === page ? "var(--gold)" : "transparent",
                  color: pageNum === page ? "#000" : "var(--text)",
                  borderColor: pageNum === page ? "var(--gold)" : "var(--border)",
                }}
              >
                {pageNum}
              </Link>
            );
          })}
          {page < totalPages && (
            <Link
              href={categoryPagePath(category, page + 1)}
              prefetch={false}
              className="btn-outline"
              rel="next"
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none" }}
            >
              Next →
            </Link>
          )}
        </nav>
      )}

      <section style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
        <h2
          style={{
            fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)",
            fontWeight: 800,
            marginBottom: "1.25rem",
            color: "var(--text)",
            fontFamily: "var(--font-primary)",
          }}
        >
          Why Hire {category} Artists on {siteConfig.name}
        </h2>
        <div style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "900px" }}>
          {categorySeoContent(category, total)
            .split("\n\n")
            .map((paragraph, i) => (
              <p key={i} style={{ marginBottom: "1rem" }}>
                {paragraph}
              </p>
            ))}
        </div>
      </section>

      {categories.length > 1 && (
        <div style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
          <h3
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
              fontWeight: 800,
              marginBottom: "1.25rem",
              color: "var(--text)",
              fontFamily: "var(--font-primary)",
            }}
          >
            Explore Other Entertainment Categories
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {categories
              .filter((c) => c.toLowerCase() !== category.toLowerCase())
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
                  Hire {pluralizeCategory(c)} ↗
                </a>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
