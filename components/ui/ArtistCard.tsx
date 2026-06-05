"use client";

import Link from "next/link";
import { formatDuration } from "@/lib/utils/formatters";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { useFavorites } from "@/components/providers/FavoritesProvider";

export default function ArtistCard({ artist, index }: { artist: any, index?: number }) {
  const { isFavorite, toggleFavorite: contextToggleFavorite, loading: favoritesLoading } = useFavorites();
  const favorite = isFavorite(artist._id);
  const loading = favoritesLoading;

  const genres = Array.isArray(artist.performance?.genres) ? artist.performance.genres : [];

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await contextToggleFavorite(artist._id);
  };
  
  return (
    <Link 
      className="artist-card reveal" 
      href={`/artists/${artist.slug}`} 
      style={index !== undefined ? { transitionDelay: `${Math.min(index, 8) * 0.07}s` } : {}}
    >
      <div className="artist-img-wrap">
        <img 
          src={
            artist.media?.images?.[0] 
              ? (artist.media.images[0].startsWith('http') 
                  ? artist.media.images[0] 
                  : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${artist.media.images[0].startsWith('/') ? artist.media.images[0].slice(1) : artist.media.images[0]}`)
              : "https://placehold.co/600x400/1a1a1a/d4a017?text=No+Image"
          } 
          alt={`${artist.name} — ${artist.category || "performer"} — ${artist.location?.city || "India"} based artist`} 
          loading="lazy" 
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes("placehold.co")) {
              target.src = "https://placehold.co/600x400/1a1a1a/d4a017?text=Artist";
            }
          }}
        />
        <div className="artist-badge-cat">{artist.category}</div>
        
        <button 
          onClick={handleToggleFavorite}
          disabled={loading}
          style={{
            position: 'absolute', top: '12px', right: '12px', zIndex: 10,
            width: '36px', height: '36px', borderRadius: '50%',
            background: favorite ? 'var(--gold)' : 'rgba(0,0,0,0.5)',
            border: 'none', cursor: 'pointer', display: 'grid', placeItems: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(4px)',
            color: favorite ? '#000' : '#fff',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.72-8.72 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <div className="artist-overlay">
          <button className="artist-overlay-btn">View Details →</button>
        </div>
      </div>
      <div className="artist-info">
        <div className="artist-name">{artist.name}</div>
        <div className="artist-meta">
          <span className="artist-loc">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z"/><circle cx="12" cy="9" r="2.5"/>
            </svg> {artist.location?.city || "India"}
          </span>
        </div>
        <div className="artist-genres">
          {genres.slice(0, 2).map((g: string) => (
            <span key={g} className="genre-tag">{g}</span>
          ))}
          {genres.length > 2 && <span className="genre-tag">+{genres.length - 2}</span>}
        </div>
        <div className="artist-footer">
          <span className="artist-duration">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>
            </svg> {formatDuration(artist.performance?.duration_minutes?.min, artist.performance?.duration_minutes?.max)}
          </span>
          <button className="artist-book-btn">Enquire</button>
        </div>
      </div>
    </Link>
  );
}

