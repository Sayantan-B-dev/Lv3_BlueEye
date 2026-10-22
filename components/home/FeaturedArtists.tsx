"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

const MagicBento = dynamic(() => import("@/components/react-bits/MagicBento"), {
  ssr: false,
});

export default function FeaturedArtists({ artists }: { artists: unknown[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    const els = containerRef.current?.querySelectorAll('.reveal');
    els?.forEach(el => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  return (
    <section id="artists" ref={containerRef}>
      <div className="section-inner">
        <div className="artists-header reveal">
          <div>
            <div className="section-label">Handpicked for You</div>
            <h2 className="section-title">Featured <span>Artists</span></h2>
            <p className="section-desc">Top-rated performers trusted by thousands of events across India and globally.</p>
          </div>
          <Link href="/artists" prefetch={false} className="btn-outline">All Artists →</Link>
        </div>

        <div className="reveal" style={{ marginTop: '2.5rem' }}>
          <MagicBento 
            artists={artists}
            textAutoHide={false}
            enableStars={true}
            enableSpotlight={true}
            enableBorderGlow={true}
            enableTilt={true}
            enableMagnetism={false}
            clickEffect={false}
            spotlightRadius={100}
            particleCount={5}
            glowColor="132, 0, 255"
            disableAnimations={false}
          />
        </div>
      </div>
    </section>
  );
}
