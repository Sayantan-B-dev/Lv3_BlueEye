import type { Metadata } from "next";
import Image from "next/image";
import { getArtistBySlug } from "@/lib/services/artistService";
import { notFound } from "next/navigation";
import { formatDuration, formatTeamSize } from "@/lib/utils/formatters";
import Link from "next/link";
import {
  artistProfilePath,
  artistSummary,
  pageMetadata,
  resolveMediaUrl,
} from "@/lib/seo/metadata";
import { artistJsonLd, breadcrumbJsonLd, personJsonLd } from "@/lib/seo/jsonld";
import { siteConfig } from "@/lib/config/site";
import AdminEditArtistButton from "@/components/ui/AdminEditArtistButton";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) {
    return { title: "Artist Not Found" };
  }

  const description = artistSummary(artist);
  const image = resolveMediaUrl(artist.media?.images?.[0]);

  const ogImage = image || undefined;

  return pageMetadata({
    title: `Book ${artist.name}${artist.category ? ` — ${artist.category}` : ""}`,
    description,
    path: artistProfilePath(slug),
    image: ogImage,
    ogType: "artist",
    ogCategory: artist.category,
  });
}

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);

  if (!artist) {
    notFound();
  }



  const profileImage =
    artist.media?.images?.[0]
      ? resolveMediaUrl(artist.media.images[0]) ??
        (artist.media.images[0].startsWith("http")
          ? artist.media.images[0]
          : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${artist.media.images[0].startsWith("/") ? artist.media.images[0].slice(1) : artist.media.images[0]}`)
      : "https://placehold.co/600x800/1a1a1a/d4a017?text=No+Image";

  const structuredData = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Artists", path: "/artists" },
      { name: artist.name, path: artistProfilePath(slug) },
    ]),
    artistJsonLd(artist),
    personJsonLd(artist),
  ];

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  return (
    <article className="section-inner pt-nav">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <nav aria-label="Breadcrumb">
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--muted,#9ca3af)",
              display: "flex",
              gap: "0.4rem",
              alignItems: "center",
            }}
          >
            <Link href="/" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>Home</Link>
            <span>/</span>
            <Link href="/artists" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
              Artists
            </Link>
            <span>/</span>
            <span>{artist.name}</span>
          </div>
        </nav>
        <div className="flex gap-2 flex-wrap items-center">
          <AdminEditArtistButton artistId={artist._id.toString()} />
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${artist.name} ${artist.category || ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline mm-action-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
            YouTube
          </a>
          <a
            href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${artist.name},${artist.category || ""}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline mm-action-link"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
            Google Images
          </a>
        </div>
      </div>

      <div className="artist-profile-layout">
        
        {/* Left Col: Media */}
        <div>
          <div className="artist-main-img">
            <Image 
              src={profileImage}
              alt={`${artist.name} — ${artist.category || "performer"} profile photo`}
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority
            />
          </div>
          
          {artist.media?.images?.length > 1 && (
            <div className="artist-gallery-grid">
              {artist.media.images.slice(1, 5).map((img: string, i: number) => {
                const src = img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${img.startsWith('/') ? img.slice(1) : img}`;
                return (
                  <div key={i} className="gallery-img-wrapper">
                    <Image 
                      src={src}
                      alt={`${artist.name} performance gallery image ${i + 2}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 250px"
                      className="object-cover"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Details */}
        <div>
          <p className="section-label">{artist.category}</p>
          <h1 className="section-title text-5xl mb-4">{artist.name}</h1>
          
          <div className="profile-meta">
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {artist.location?.city || "India"}
            </div>
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatDuration(artist.performance?.duration_minutes?.min, artist.performance?.duration_minutes?.max)}
            </div>
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {formatTeamSize(artist.performance?.team_members?.min, artist.performance?.team_members?.max)}
            </div>
          </div>

          <section className="section-block" aria-labelledby="artist-about-heading">
            <h2 id="artist-about-heading">About the Artist</h2>
            <div className="text-text2 leading-relaxed space-y-4">
              {Array.isArray(artist.about) ? (
                artist.about.map((p: string, i: number) => <p key={i}>{p}</p>)
              ) : (
                <p>{artist.about || "No details provided."}</p>
              )}
            </div>
          </section>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {artist.performance?.genres?.length > 0 && (
              <section className="section-block" aria-labelledby="artist-genres-heading">
                <h2 id="artist-genres-heading">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.performance.genres.map((g: string) => (
                    <span key={g} className="genre-tag">{g}</span>
                  ))}
                </div>
              </section>
            )}

            {artist.performance?.languages?.length > 0 && (
              <section className="section-block" aria-labelledby="artist-languages-heading">
                <h2 id="artist-languages-heading">Languages</h2>
                <div className="flex flex-wrap gap-2">
                  {artist.performance.languages.map((l: string) => (
                    <span key={l} className="genre-tag opacity-80">{l}</span>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Booking Card */}
          <section className="booking-card" aria-labelledby="artist-booking-heading">
            <h2 id="artist-booking-heading" className="text-2xl font-bold mb-2">Book {artist.name}</h2>
            <p className="text-text2 mb-6 text-sm">Professional booking services for your private events, weddings, and corporate shows on {siteConfig.name}.</p>
            <Link href={`/book-artist?artist=${artist.slug}`} className="btn-primary w-full py-4 text-lg">
              Check Availability & Pricing ✦
            </Link>
          </section>
        </div>
      </div>

      {/* Videos Section */}
      {artist.media?.videos?.length > 0 && (
        <section className="video-section" aria-labelledby="artist-videos-heading">
          <div className="section-header mb-12">
            <p className="section-label">Performance Clips</p>
            <h2 id="artist-videos-heading" className="section-title">Watch <span>In Action</span></h2>
          </div>
          
          <div className="video-grid">
            {artist.media.videos.map((vid: string, i: number) => {
              const ytId = getYouTubeId(vid);
              if (!ytId) return null;
              return (
                <div key={i} className="video-card">
                  <iframe 
                    className="video-iframe"
                    src={`https://www.youtube.com/embed/${ytId}`}
                    title={`${artist.name} performance video ${i + 1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
