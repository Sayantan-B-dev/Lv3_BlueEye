import { getArtists } from "@/lib/services/artistService";
import { getDistinctCities } from "@/lib/services/searchService";
import ArtistCard from "@/components/ui/ArtistCard";
import { siteConfig } from "@/lib/config/site";
import { cityPath, cityPagePath } from "@/lib/seo/slugs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { citySeoContent } from "@/lib/seo/content";

export const CITY_PAGE_SIZE = 24;

type ArtistRow = { slug: string; [key: string]: unknown };

export default async function CityArtistsView({
  city,
  page,
}: {
  city: string;
  page: number;
}) {
  const [cities, result] = await Promise.all([
    getDistinctCities(),
    getArtists({ city, page, limit: CITY_PAGE_SIZE }),
  ]);

  const { artists, total } = result as { artists: ArtistRow[]; total: number };
  const totalPages = Math.ceil(total / CITY_PAGE_SIZE);
  const canonicalPath = cityPath(city);

  const structuredData = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Artists", path: "/artists" },
      { name: city, path: canonicalPath },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Performers in ${city}`,
      description: `Find and book singers, DJs, comedians, and performers in ${city} for weddings, events, and parties.`,
      numberOfItems: total,
      itemListElement: artists.slice(0, 20).map((a: ArtistRow, i: number) => ({
        "@type": "ListItem",
        position: i + 1 + (page - 1) * CITY_PAGE_SIZE,
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
        <span>{city}</span>
      </nav>
      <div className="artists-header">
        <div>
          <div className="section-label">Location</div>
          <h1 className="section-title">
            Book Artists in <span>{city}</span>
          </h1>
          <p className="section-desc">
            Discover and book live performers based in {city} for weddings, corporate events,
            and private parties across India. Browse {total} verified artists available in {city}.
          </p>
        </div>
      </div>

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
              href={cityPagePath(city, page - 1)}
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
                href={cityPagePath(city, pageNum)}
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
              href={cityPagePath(city, page + 1)}
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
          Book Artists in {city} — Premium Entertainment
        </h2>
        <div style={{ color: "var(--text2)", lineHeight: 1.8, fontSize: "0.95rem", maxWidth: "900px" }}>
          {citySeoContent(city, total)
            .split("\n\n")
            .map((paragraph, i) => (
              <p key={i} style={{ marginBottom: "1rem" }}>
                {paragraph}
              </p>
            ))}
        </div>
      </section>

      {cities.length > 1 && (
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
            Explore Performers in Other Cities
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {cities
              .filter((c) => c.toLowerCase() !== city.toLowerCase())
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
