import type { Metadata } from "next";
import { searchArtists } from "@/lib/services/searchService";
import Link from "next/link";
import ArtistCard from "@/components/ui/ArtistCard";
import { siteConfig } from "@/lib/config/site";
import { noIndexRobots, pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; city?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();

  if (!q) {
    return {
      ...pageMetadata({
        title: "Search Artists",
        description: `Search singers, DJs, comedians, and live performers across India on ${siteConfig.name}.`,
        path: "/search",
      }),
      robots: noIndexRobots,
    };
  }

  const query = new URLSearchParams({ q });
  if (params.category) query.set("category", params.category);
  if (params.city) query.set("city", params.city);

  return {
    ...pageMetadata({
      title: `Search: ${q}`,
      description: `Find artists matching "${q}" for your next event on ${siteConfig.name}.`,
      path: `/search?${query.toString()}`,
    }),
    robots: noIndexRobots,
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string, category?: string, city?: string }> }) {
  const params = await searchParams;
  
  const q = params.q || "";
  const searchResult = q 
    ? await searchArtists(q, { category: params.category, city: params.city }) 
    : { artists: [], pagination: { total: 0 } };
  const artists = searchResult.artists;
  const totalCount = searchResult.pagination.total;



  return (
    <div className="section-inner" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', paddingTop: 'calc(var(--hdr-h) + 2rem)' }}>
      <div className="artists-header">
        <div>
          <div className="section-label">Search Results</div>
          <h1 className="section-title">Results for <span>"{q || "artists"}"</span></h1>
          <p className="section-desc">Found {totalCount} artists matching your search.</p>
        </div>
      </div>

      {artists.length === 0 ? (
        <div style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text2)' }}>
          <p>No artists found. Try adjusting your search query or filters.</p>
          <Link href="/artists" className="btn-outline" style={{ marginTop: '1rem' }}>Browse All Artists</Link>
        </div>
      ) : (
        <div className="artists-grid">
          {artists.map((artist: any, i: number) => (
            <ArtistCard 
              key={artist.slug} 
              artist={artist} 
              index={i} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
