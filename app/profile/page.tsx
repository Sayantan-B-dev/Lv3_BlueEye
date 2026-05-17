"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArtistCard from "@/components/ui/ArtistCard";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/users/favorites")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFavorites(data.data);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="section-inner" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader">Loading your profile...</div>
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <div className="section-inner" style={{ padding: 'calc(var(--hdr-h) + 4rem) 1rem 6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '4rem', padding: '2rem', background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--saffron))', display: 'grid', placeItems: 'center', fontSize: '2.5rem', fontWeight: 900, color: '#0a0807' }}>
          {user?.name?.[0] || user?.email?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: '0.25rem' }}>{user?.name || "Member"}</h1>
          <p style={{ color: 'var(--text3)' }}>@{user?.username || "user"}</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
             <span style={{ padding: '0.2rem 0.6rem', background: 'rgba(212,160,23,0.1)', color: 'var(--gold)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{user?.role}</span>
             <span style={{ color: 'var(--text2)', fontSize: '0.85rem' }}>{user?.email}</span>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">Your <span>Favorites</span></h2>
        <p className="section-desc">Artists you've shortlisted for your future events.</p>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
          <p style={{ color: 'var(--text3)', marginBottom: '1.5rem' }}>You haven't added any favorites yet.</p>
          <Link href="/artists" className="btn-primary">Explore Artists</Link>
        </div>
      ) : (
        <div className="artists-grid">
          {favorites.map((artist, i) => (
            <ArtistCard key={artist._id} artist={artist} index={i} initialIsFavorite={true} />
          ))}
        </div>
      )}
    </div>
  );
}
