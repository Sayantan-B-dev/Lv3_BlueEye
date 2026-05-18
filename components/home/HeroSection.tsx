"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Artist {
  _id: string;
  name: string;
  category: string;
  location?: { city?: string; state?: string };
  media?: { images?: string[] };
  performance?: { genres?: string[] };
}

interface Event {
  _id: string;
  title: string;
  category: string;
  date: string;
  status: string;
}

export default function HeroSection({ categories, artists: initialArtists }: { categories: string[], artists?: Artist[] }) {
  const router = useRouter();

  // fallback premium mock data to ensure layout always looks gorgeous
  const fallbackArtists: Artist[] = [
    {
      _id: "fall-1",
      name: "Arijit Singh",
      category: "singer",
      location: { city: "Mumbai", state: "MH" },
      media: { images: ["https://placehold.co/600x400/1a1a1a/d4a017?text=Arijit+Singh"] },
      performance: { genres: ["Bollywood", "Romantic"] }
    },
    {
      _id: "fall-2",
      name: "Zakir Khan",
      category: "Comedian",
      location: { city: "Indore", state: "MP" },
      media: { images: ["https://placehold.co/600x400/1a1a1a/d4a017?text=Zakir+Khan"] },
      performance: { genres: ["Comedy", "Storytelling"] }
    },
    {
      _id: "fall-3",
      name: "Nucleya",
      category: "DJ",
      location: { city: "Goa", state: "GA" },
      media: { images: ["https://placehold.co/600x400/1a1a1a/d4a017?text=Nucleya"] },
      performance: { genres: ["EDM", "Bass"] }
    },
    {
      _id: "fall-4",
      name: "Raftaar",
      category: "rapper",
      location: { city: "Delhi", state: "DL" },
      media: { images: ["https://placehold.co/600x400/1a1a1a/d4a017?text=Raftaar"] },
      performance: { genres: ["Hip-Hop", "Rap"] }
    }
  ];

  const fallbackEvents: Event[] = [];

  // states for dynamic widgets
  const [artists, setArtists] = useState<Artist[]>(initialArtists && initialArtists.length > 0 ? initialArtists : fallbackArtists);
  const [events, setEvents] = useState<Event[]>([]);
  const [currentArtistIndex, setCurrentArtistIndex] = useState(0);

  const categoriesGrid = [
    {
      name: "Singer",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
      )
    },
    {
      name: "Comedian",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z"/><path d="M9.5 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z"/><path d="M12 18c-2.4 0-4.4-1.2-5.4-3h10.8c-1 1.8-3 3-5.4 3Z"/><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z"/></svg>
      )
    },
    {
      name: "DJ",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 12l5 5"/></svg>
      )
    },
    {
      name: "rapper",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><circle cx="12" cy="12" r="3"/><line x1="16" y1="8" x2="16.01" y2="8"/></svg>
      )
    }
  ];

  // fetch events on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const eventsRes = await fetch("/api/events?limit=3").then(r => r.json());
        if (eventsRes && !eventsRes.error && eventsRes.events?.length > 0) {
          setEvents(eventsRes.events);
        } else {
          setEvents(fallbackEvents);
        }
      } catch (err) {
        console.error("Failed to load hero events data:", err);
        setEvents(fallbackEvents);
      }
    }
    fetchData();
  }, []);

  // auto rotate artist carousel (random fetch/rotation every 3.5 seconds)
  useEffect(() => {
    if (artists.length === 0) return;
    const interval = setInterval(() => {
      setCurrentArtistIndex((prev) => {
        if (artists.length <= 1) return 0;
        let nextIdx = Math.floor(Math.random() * artists.length);
        while (nextIdx === prev) {
          nextIdx = Math.floor(Math.random() * artists.length);
        }
        return nextIdx;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [artists]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = fd.get("q") as string;
    const cat = fd.get("category") as string;
    let url = `/search?q=${encodeURIComponent(q)}`;
    if (cat) url += `&category=${encodeURIComponent(cat)}`;
    router.push(url);
  };

  const activeArtist = artists[currentArtistIndex] || fallbackArtists[0];

  return (
    <section id="hero">
      <div className="hero-wrapper">
        
        {/* Left Side Section — Centered and kept to 50% width on Desktop */}
        <div className="hero-left">
          <div className="hero-badge">India's No. 1 Artist Booking Platform</div>

          <h1 className="hero-title">
            Book the <em>Perfect Artist</em><br />for Every Stage
          </h1>

          <p className="hero-sub">
            From chart-topping Bollywood singer to legendary Sufi maestros — discover, connect, and book artists across India and the world.
          </p>

          <form className="hero-search" onSubmit={handleSearch}>
            <input type="text" name="q" placeholder="Search artist by name…" required />
            <select name="category">
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="submit">Search ↗</button>
          </form>

          <div className="hero-tags">
            <Link href="/search?category=singer" className="hero-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              singer
            </Link>
            <Link href="/search?category=Comedian" className="hero-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z"/><path d="M9.5 10c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5Z"/><path d="M12 18c-2.4 0-4.4-1.2-5.4-3h10.8c-1 1.8-3 3-5.4 3Z"/><path d="M22 12A10 10 0 1 1 12 2a10 10 0 0 1 10 10Z"/></svg>
              Comedian
            </Link>
            <Link href="/search?category=DJ" className="hero-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 12l5 5"/></svg>
              DJ
            </Link>
          </div>
        </div>

        {/* Right Side Section — Interactive Live Performance Widgets Panel */}
        <div className="hero-right">
          
          {/* Top Right Component — Auto-rotating Artist Carousel Card */}
          <div className="hero-right-top">
            <div className="hero-glass-glow"></div>
            {activeArtist && (
              <div 
                className="carousel-slide" 
                key={activeArtist._id}
                style={{
                  backgroundImage: `url(${
                    activeArtist.media?.images?.[0] 
                      ? (activeArtist.media.images[0].startsWith('http') 
                          ? activeArtist.media.images[0] 
                          : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""}/${activeArtist.media.images[0].startsWith('/') ? activeArtist.media.images[0].slice(1) : activeArtist.media.images[0]}`)
                      : "https://placehold.co/600x400/1a1a1a/d4a017?text=No+Image"
                  })`
                }}
              >
                <span className="carousel-live-badge">FEATURED</span>
                
                <div className="carousel-details">
                  <span className="carousel-cat-label">{activeArtist.category}</span>
                  <h3 className="carousel-artist-name">{activeArtist.name}</h3>
                  <p className="carousel-meta-text">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    {activeArtist.location?.city || "Mumbai"}, {activeArtist.location?.state || "MH"}
                  </p>
                  <div className="carousel-genres-row">
                    {activeArtist.performance?.genres?.slice(0, 2).map((g) => (
                      <span key={g} className="carousel-genre-pill">{g}</span>
                    ))}
                  </div>
                  <Link href={`/artists/${activeArtist.name.toLowerCase().replace(/ /g, "-")}`} className="carousel-book-btn">
                    View Profile ↗
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Right Components — Categories pulse matrix (left) and Real-time Events Stack (right) */}
          <div className="hero-right-bottom">
            
            {/* Left Block — Random fading category matrix */}
            <div className="hero-right-bottom-left">
              {categoriesGrid.map((cat, idx) => {
                // Determine CSS animation offset delay for clockwise flow
                // singer (0) -> Comedian (1) -> rapper (3) -> DJ (2)
                let delay = "0s";
                if (idx === 0) delay = "0s";
                else if (idx === 1) delay = "-1.0s";
                else if (idx === 3) delay = "-2.0s";
                else if (idx === 2) delay = "-3.0s";

                return (
                  <Link 
                    href={`/category/${cat.name}`} 
                    key={cat.name} 
                    className="category-pulse-box"
                    style={{ animationDelay: delay }}
                  >
                    <div className="category-pulse-icon">
                      {cat.icon}
                    </div>
                    <span className="category-pulse-name">{cat.name}</span>
                    <div className="pulse-neon-border"></div>
                  </Link>
                );
              })}
            </div>

            {/* Right Block — Real-time top 3 events widget */}
            <div className="hero-right-bottom-right">
              <div className="widget-header">
                <span className="widget-ping-dot"></span>
                <span className="widget-title">Live Arenas</span>
              </div>
              
              <div className="widget-events-list">
                {events.map((evt) => (
                  <div className="widget-event-row" key={evt._id}>
                    <div className="widget-event-badge-row">
                      <span className={`event-status-pill ${evt.status.toLowerCase()}`}>
                        {evt.status}
                      </span>
                      <span className="event-cat-pill">{evt.category}</span>
                    </div>
                    <h4 className="event-widget-title">{evt.title}</h4>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      <div className="scroll-hint">
        <div className="scroll-mouse">
          <div className="scroll-wheel"></div>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'var(--font-primary)' }}>
          Scroll to explore
        </span>
      </div>
    </section>
  );
}
