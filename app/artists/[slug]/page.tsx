import { getArtistBySlug } from "@/lib/services/artistService";
import { notFound } from "next/navigation";
import { formatDuration, formatTeamSize } from "@/lib/utils/formatters";
import Link from "next/link";

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);

  if (!artist) {
    notFound();
  }

  // Helper to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <div className="section-inner pt-nav">
      <div className="artist-profile-layout">
        
        {/* Left Col: Media */}
        <div>
          <div className="artist-main-img">
            <img 
              src={
                artist.media?.images?.[0] 
                  ? (artist.media.images[0].startsWith('http') 
                      ? artist.media.images[0] 
                      : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${artist.media.images[0].startsWith('/') ? artist.media.images[0].slice(1) : artist.media.images[0]}`)
                  : "https://placehold.co/600x800/1a1a1a/d4a017?text=No+Image"
              } 
              alt={artist.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {artist.media?.images?.length > 1 && (
            <div className="artist-gallery-grid">
              {artist.media.images.slice(1, 5).map((img: string, i: number) => (
                <img 
                  key={i} 
                  src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${img.startsWith('/') ? img.slice(1) : img}`} 
                  className="gallery-img"
                  alt={`${artist.name} gallery ${i+1}`} 
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Details */}
        <div>
          <div className="section-label">{artist.category}</div>
          <h1 className="section-title text-5xl mb-4">{artist.name}</h1>
          
          <div className="profile-meta">
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {artist.location?.city || "India"}
            </div>
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatDuration(artist.performance?.duration_minutes?.min, artist.performance?.duration_minutes?.max)}
            </div>
            <div className="meta-item">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {formatTeamSize(artist.performance?.team_members?.min, artist.performance?.team_members?.max)}
            </div>
          </div>

          <div className="section-block">
            <h3>About the Artist</h3>
            <div className="text-text2 leading-relaxed space-y-4">
              {Array.isArray(artist.about) ? (
                artist.about.map((p: string, i: number) => <p key={i}>{p}</p>)
              ) : (
                <p>{artist.about || "No details provided."}</p>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {artist.performance?.genres?.length > 0 && (
              <div className="section-block">
                <h3>Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.performance.genres.map((g: string) => (
                    <span key={g} className="genre-tag">{g}</span>
                  ))}
                </div>
              </div>
            )}

            {artist.performance?.languages?.length > 0 && (
              <div className="section-block">
                <h3>Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {artist.performance.languages.map((l: string) => (
                    <span key={l} className="genre-tag opacity-80">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Card */}
          <div className="booking-card">
            <h3 className="text-2xl font-bold mb-2">Book {artist.name}</h3>
            <p className="text-text2 mb-6 text-sm">Professional booking services for your private events, weddings, and corporate shows.</p>
            <Link href={`/book-artist?artist=${artist.slug}`} className="btn-primary w-full py-4 text-lg">
              Check Availability & Pricing ✦
            </Link>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      {artist.media?.videos?.length > 0 && (
        <div className="video-section">
          <div className="section-header mb-12">
            <div className="section-label">Performance Clips</div>
            <h2 className="section-title">Watch <span>In Action</span></h2>
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
                    title={`${artist.name} video ${i+1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
