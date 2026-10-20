import { getArtists } from "@/lib/services/artistService";
import { getCategoryCityCounts } from "@/lib/services/searchService";
import ArtistCard from "@/components/ui/ArtistCard";
import { siteConfig } from "@/lib/config/site";
import { categoryPath, cityPath } from "@/lib/seo/slugs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { comboSeoContent, pluralizeCategory } from "@/lib/seo/content";
import { slugify } from "@/lib/utils/slugify";
import { notFound } from "next/navigation";

type Combo = { category: string; city: string; count: number };

async function getCombos(): Promise<Combo[]> {
  return (await getCategoryCityCounts(3).catch(() => [])) as Combo[];
}

function findCombo(combos: Combo[], categorySlug: string, citySlug: string): Combo | undefined {
  return combos.find(
    (combo) =>
      slugify(combo.category) === categorySlug.toLowerCase() &&
      slugify(combo.city) === citySlug.toLowerCase()
  );
}

const PAGE_SIZE = 24;

export default async function CategoryCityArtistsView({
  category,
  city,
  page,
}: {
  category: string;
  city: string;
  page: number;
}) {
  const combos = await getCombos();
  const combo = findCombo(combos, category, city);
  if (!combo) notFound();

  const canonicalPath = `/category/${category}/${city}`;
  const currentPage = Math.max(1, page);

  const { artists, total } = await getArtists({
    category: combo.category,
    city: combo.city,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const structuredData = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Artists", path: "/artists" },
      { name: combo.category, path: categoryPath(combo.category) },
      { name: combo.city, path: canonicalPath },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${combo.category} Artists in ${combo.city}`,
      description: `Hire verified ${combo.category.toLowerCase()} artists in ${combo.city} for weddings, corporate events, and parties.`,
      numberOfItems: total,
      itemListElement: artists.slice(0, 20).map((a: { slug: string }, i: number) => ({
        "@type": "ListItem",
        position: i + 1 + (currentPage - 1) * PAGE_SIZE,
        url: `${siteConfig.url}/artists/${a.slug}`,
      })),
    },
  ];

  const relatedSameCategory = combos
    .filter(
      (c) =>
        slugify(c.city) !== city.toLowerCase() &&
        slugify(c.category) === category.toLowerCase()
    )
    .slice(0, 8);
  const relatedSameCity = combos
    .filter(
      (c) =>
        slugify(c.category) !== category.toLowerCase() &&
        slugify(c.city) === city.toLowerCase()
    )
    .slice(0, 8);

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
      <nav aria-label="Breadcrumb"
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
        <Link href={categoryPath(combo.category)} style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          {combo.category}
        </Link>
        <span>/</span>
        <span>{combo.city}</span>
      </nav>
      <div className="artists-header">
        <div>
          <div className="section-label">{combo.city}</div>
          <h1 className="section-title">
            Hire <span>{combo.category}</span> Artists in {combo.city}
          </h1>
          <p className="section-desc">
            Book verified {combo.category.toLowerCase()} performers in {combo.city} for weddings,
            corporate events, and parties. Browse {total} {combo.category.toLowerCase()} artists
            available in {combo.city} and connect directly with top talent.
          </p>
        </div>
      </div>

      <div className="artists-grid">
        {artists.map((artist: { slug: string; [key: string]: unknown }, i: number) => (
          <ArtistCard
            key={artist.slug}
            artist={artist}
            index={i}
          />
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
          {currentPage > 1 && (
            <Link
              href={currentPage - 1 === 1 ? canonicalPath : `${canonicalPath}/page/${currentPage - 1}`}
              className="btn-outline"
              rel="prev"
              style={{ padding: "0.5rem 1rem", borderRadius: "8px", textDecoration: "none" }}
            >
              ← Prev
            </Link>
          )}
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
            const startPage = Math.max(1, currentPage - 4);
            const pageNum = startPage + i;
            if (pageNum > totalPages) return null;
            const href = pageNum === 1 ? canonicalPath : `${canonicalPath}/page/${pageNum}`;
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
              href={`${canonicalPath}/page/${currentPage + 1}`}
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
        <h2 style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text)", fontFamily: "var(--font-primary)" }}>
          Why Book {combo.category} Artists in {combo.city} on {siteConfig.name}
        </h2>
        <div style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "900px" }}>
          {comboSeoContent(combo.category, combo.city, total).split("\n\n").map((paragraph, i) => (
            <p key={i} style={{ marginBottom: "1rem" }}>{paragraph}</p>
          ))}
        </div>
      </section>

      {(relatedSameCategory.length > 0 || relatedSameCity.length > 0) && (
        <div style={{ marginTop: "5rem", paddingTop: "2.5rem", borderTop: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "clamp(1.1rem, 2vw, 1.35rem)", fontWeight: 800, marginBottom: "1.25rem", color: "var(--text)", fontFamily: "var(--font-primary)" }}>
            Explore More in {combo.city}
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <a
              href={categoryPath(combo.category)}
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
              All {pluralizeCategory(combo.category)} ↗
            </a>
            <a
              href={cityPath(combo.city)}
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
              All Artists in {combo.city} ↗
            </a>
            {relatedSameCity.map((c) => (
              <a
                key={c.category}
                href={`/category/${slugify(c.category)}/${city}`}
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
                Hire {pluralizeCategory(c.category)} in {combo.city} ↗
              </a>
            ))}
            {relatedSameCategory.map((c) => (
              <a
                key={c.city}
                href={`/category/${category}/${slugify(c.city)}`}
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
                {combo.category} in {c.city} ↗
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}