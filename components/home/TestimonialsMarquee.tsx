"use client";

import { useEffect, useState, useRef } from "react";

interface UserProfile {
  name?: string;
  username?: string;
  image?: string;
  address?: string;
}

interface ReviewItem {
  _id: string;
  user?: UserProfile | null;
  rating: number;
  text: string;
  isEdited: boolean;
  role?: string;
}

const MOCK_REVIEWS: ReviewItem[] = [];

export default function TestimonialsMarquee() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          // Merge dynamic database reviews with our premium fallback mock testimonials
          setReviews([...data.data, ...MOCK_REVIEWS]);
        } else {
          setReviews(MOCK_REVIEWS);
        }
      })
      .catch(() => {
        setReviews(MOCK_REVIEWS);
      });
  }, []);

  if (reviews.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Duplicate list to achieve a seamless, infinite perpetual marquee loop
  const marqueeItems = [...reviews, ...reviews];

  return (
    <div 
      className="marquee-wrap" 
      style={{ 
        border: 'none', 
        background: 'transparent', 
        padding: '2rem 0',
        overflow: 'hidden',
        maskImage: 'linear-gradient(to right, transparent, #000 15%, #000 85%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, #000 15%, #000 85%, transparent)'
      }}
    >
      <div 
        ref={trackRef}
        className="marquee-track" 
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ 
          display: 'flex', 
          gap: '2rem', 
          animation: 'marquee 50s linear infinite', 
          animationPlayState: isPaused ? 'paused' : 'running',
          whiteSpace: 'nowrap',
          width: 'max-content'
        }}
      >
        {marqueeItems.map((item, idx) => {
          const authorName = item.user?.name || "Verified Customer";
          const displayAddress = item.user?.address || item.role || "";
          const initials = authorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div 
              key={`${item._id}-${idx}`}
              className="testimonial-card"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '24px',
                padding: '2rem',
                width: '350px',
                flexShrink: 0,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                whiteSpace: 'normal',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
              }}
            >
              <div className="quote-mark" style={{ top: '0.75rem', right: '1.25rem', fontSize: '4.5rem', opacity: 0.15 }}>"</div>
              
              <div>
                <div className="stars" style={{ display: 'flex', gap: '3px', marginBottom: '0.75rem' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className="star" 
                      style={{ 
                        color: 'var(--gold)', 
                        fontSize: '0.95rem' 
                      }}
                    >
                      {i < item.rating ? "★" : "☆"}
                    </span>
                  ))}
                </div>
                
                <p 
                  className="testimonial-text" 
                  style={{ 
                    fontSize: '0.85rem', 
                    lineHeight: '1.6', 
                    color: 'var(--text2)', 
                    fontStyle: 'italic', 
                    fontWeight: 'normal', 
                    marginBottom: 0 
                  }}
                >
                  "{item.text}"
                </p>
              </div>

              <div className="testimonial-author" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div 
                  className="author-avatar" 
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--gold), var(--saffron))', 
                    display: 'grid', 
                    placeItems: 'center', 
                    fontWeight: 700, 
                    fontSize: '0.8rem', 
                    color: '#0a0807',
                    flexShrink: 0 
                  }}
                >
                  {initials || "U"}
                </div>
                <div>
                  <div className="author-name" style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                    {authorName}
                  </div>
                  <div className="author-role" style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                    {displayAddress}
                    {item.isEdited && <span style={{ fontSize: '0.7rem', color: 'var(--text3)', fontStyle: 'italic', marginLeft: '0.4rem' }}>(edited)</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
