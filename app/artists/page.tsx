import type { Metadata } from "next";
import { getArtists } from "@/lib/services/artistService";
export const dynamic = "force-dynamic";

import { getUserFavorites } from "@/lib/services/userService";
import { getDistinctCategories, getDistinctCities } from "@/lib/services/searchService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import Link from "next/link";
import ArtistCard from "@/components/ui/ArtistCard";
import ArtistFilterBar from "@/components/ui/ArtistFilterBar";
import { Suspense } from "react";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}): Promise<Metadata> {
  const { page } = await searchParams;
  const path = page && page !== "1" ? `/artists?page=${page}` : "/artists";
  return pageMetadata({
    title: "Browse Artists",
    description: `Discover and book verified singers, DJs, comedians, bands, and performers across India on ${siteConfig.name}.`,
    path,
  });
}

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<{ page?: string, category?: string, city?: string, q?: string }> }) {
  const [params, session, categories, cities] = await Promise.all([
    searchParams,
    getServerSession(authOptions),
    getDistinctCategories(),
    getDistinctCities()
  ]);
  
  const page = parseInt(params.page || "1", 10);
  const { artists, totalPages, total } = await getArtists({ 
    page, 
    category: params.category, 
    city: params.city,
    q: params.q
  }) as { artists: any[], totalPages: number, total: number };

  const favorites = session?.user ? await getUserFavorites((session.user as any).id) : [];

  return (
    <div className="section-inner" style={{ padding: 'clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)', paddingTop: 'calc(var(--hdr-h) + 2rem)' }}>
      <div className="artists-header">
        <div>
          <div className="section-label">Browse All</div>
          <h1 className="section-title">Discover <span>Artists</span></h1>
          <p className="section-desc">Showing {artists.length} of {total} artists</p>
        </div>
      </div>

      <Suspense fallback={<div className="filter-bar" style={{ minHeight: 72 }} />}>
        <ArtistFilterBar categories={categories} cities={cities} />
      </Suspense>

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

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '3rem' }}>
          {page > 1 && <Link href={`/artists?page=${page - 1}`} className="btn-outline">← Previous</Link>}
          <span style={{ display: 'flex', alignItems: 'center' }}>Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/artists?page=${page + 1}`} className="btn-outline">Next →</Link>}
        </div>
      )}
    </div>
  );
}
