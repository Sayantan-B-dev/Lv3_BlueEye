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

const MOCK_REVIEWS: ReviewItem[] = [
  {
    _id: "mock-1",
    user: { name: "Sarah Johnson", username: "sarah_j", address: "New York, NY" },
    rating: 5,
    text: "Found the perfect DJ for my wedding! Professional, punctual, and incredible energy. Highly recommend!",
    isEdited: false,
  },
  {
    _id: "mock-2",
    user: { name: "James Chen", username: "jchen", address: "Los Angeles, CA" },
    rating: 5,
    text: "Booked a live band for our corporate event. They exceeded all expectations. The entire team was amazing!",
    isEdited: false,
  },
  {
    _id: "mock-3",
    user: { name: "Emily Rodriguez", username: "emily_r", address: "Miami, FL" },
    rating: 4,
    text: "Great experience booking through ArtistHub. Easy process and the photographer was very talented.",
    isEdited: true,
  },
  {
    _id: "mock-4",
    user: { name: "Michael Thompson", username: "m_thompson", address: "Chicago, IL" },
    rating: 5,
    text: "Used ArtistHub to find a magician for my son's birthday. Everyone loved the performance!",
    isEdited: false,
  },
  {
    _id: "mock-5",
    user: { name: "Lisa Wang", username: "lisawang", address: "San Francisco, CA" },
    rating: 5,
    text: "Searched high and low for the right event planner. Found exactly what I needed on ArtistHub. Seamless!",
    isEdited: false,
  },
  {
    _id: "mock-6",
    user: { name: "David Park", username: "d_park", address: "Boston, MA" },
    rating: 4,
    text: "Excellent selection of artists. The booking process was smooth and the artist was very professional.",
    isEdited: false,
  },
  {
    _id: "mock-7",
    user: { name: "Amanda Foster", username: "amanda_f", address: "Austin, TX" },
    rating: 5,
    text: "This platform made finding entertainment for our gala so easy. Best decision ever!",
    isEdited: false,
  },
  {
    _id: "mock-8",
    user: { name: "Chris Martinez", username: "c_martinez", address: "Denver, CO" },
    rating: 5,
    text: "Booked a string quartet for our event. Absolutely stunning performance. Worth every penny!",
    isEdited: false,
  },
];

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
      className="review-divider-marquee"
      style={{
        padding: '2rem 0',
      }}
    >
      <div
        ref={trackRef}
        className="review-marquee-track"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ animationPlayState: isPaused ? 'paused' : 'running' }}
      >
        {marqueeItems.map((item, idx) => {
          const authorName = item.user?.name || "Verified Customer";
          const displayAddress = item.user?.address || item.role || "";
          const initials = authorName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

          return (
            <div
              key={`${item._id}-${idx}`}
              className="testimonial-card"
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

                <p className="testimonial-text">
                  "{item.text}"
                </p>
              </div>

              <div className="testimonial-author" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                <div className="author-avatar">
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
