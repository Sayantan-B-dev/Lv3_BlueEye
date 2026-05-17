"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import HomeBackground from "./HomeBackground";
import HeroSection from "./HeroSection";
import CategoryGrid from "./CategoryGrid";
import FeaturedArtists from "./FeaturedArtists";

export default function HomeDynamicContent() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    randomArtists: any[];
    categories: string[];
    counts: any;
  } | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // 1. Fetch Home dynamic data exactly ONCE on mount
  useEffect(() => {
    async function loadHomeData() {
      try {
        let homeData = null;
        const cached = typeof window !== "undefined" ? sessionStorage.getItem("artist_hub_home_data") : null;
        if (cached) {
          try {
            homeData = JSON.parse(cached);
          } catch (e) {
            console.error("Failed to parse cached home data from sessionStorage");
          }
        }

        if (homeData) {
          setData(homeData);
          setLoading(false);
        } else {
          const res = await fetch("/api/home-data").then(r => r.json());
          if (res.success && res.data) {
            setData(res.data);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("artist_hub_home_data", JSON.stringify(res.data));
            }
          }
        }
      } catch (err) {
        console.error("Failed to load home page dynamic data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  // 2. Fetch user favorites asynchronously only when session is active
  useEffect(() => {
    if (!session) return;
    
    async function loadFavorites() {
      try {
        const res = await fetch("/api/users/favorites").then(r => r.json());
        if (res.success && Array.isArray(res.data)) {
          setFavorites(res.data.map((f: any) => f._id || f));
        }
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    }
    loadFavorites();
  }, [session]);

  const trailImages = data?.randomArtists
    ? data.randomArtists.map((a: any) => a.media?.images?.[0]).filter((img: string | undefined) => !!img)
    : [];

  const shuffledCategories = data?.categories
    ? data.categories
    : [];

  const displayArtists = data?.randomArtists
    ? data.randomArtists.slice(0, 6)
    : [];

  if (loading) {
    return (
      <>
        {/* Placeholder Ambient Background Layer */}
        <HomeBackground trailImages={[]} />
        
        {/* Breathtaking Shimmer Hero Section Skeleton */}
        <div className="skeleton-hero-wrapper" style={{ minHeight: '85vh', padding: '10rem 2rem 5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
          <div className="skeleton-title pulsing" style={{ width: 'min(520px, 90%)', height: '3.6rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', marginBottom: '1.5rem' }}></div>
          <div className="skeleton-subtitle pulsing" style={{ width: 'min(380px, 80%)', height: '1.2rem', background: 'rgba(255,255,255,0.015)', borderRadius: '8px', marginBottom: '3.5rem' }}></div>
          <div className="skeleton-search pulsing" style={{ width: 'min(640px, 95%)', height: '3.4rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '30px', boxShadow: '0 4px 30px rgba(0,0,0,0.2)' }}></div>
        </div>

        {/* Shimmer Category Grid Skeleton */}
        <div className="container" style={{ margin: '3rem auto 5rem', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {[1, 2, 4, 5].map((i) => (
              <div key={i} className="pulsing" style={{ width: '150px', height: '2.8rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '30px' }}></div>
            ))}
          </div>
        </div>

        {/* Bento Grid Skeleton */}
        <div className="container" style={{ margin: '5rem auto', position: 'relative', zIndex: 1 }}>
          <div className="skeleton-grid-title pulsing" style={{ width: '240px', height: '2.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '2.5rem' }}></div>
          <div className="skeleton-bento-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="skeleton-card pulsing" style={{ height: '340px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '26px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}></div>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="animate-fade-in">
      <HomeBackground trailImages={trailImages} />
      
      <HeroSection categories={shuffledCategories} artists={data?.randomArtists || []} />
      
      <CategoryGrid counts={data?.counts || {}} categories={shuffledCategories} />
      
      <FeaturedArtists artists={displayArtists} favorites={favorites} />
    </div>
  );
}
