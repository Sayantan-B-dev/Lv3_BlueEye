"use client";

export function HeroSkeleton() {
  return (
    <section id="hero" className="home-skel-root" aria-hidden>
      <div className="hero-bg" />
      <div className="hero-grid" />
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      <div className="hero-wrapper">
        <div className="hero-left">
          <div className="home-skel home-skel-badge" />
          <div className="home-skel home-skel-title" />
          <div className="home-skel home-skel-title home-skel-title--short" />
          <div className="home-skel home-skel-line" />
          <div className="home-skel home-skel-line home-skel-line--short" />
          <div className="home-skel home-skel-search" />
          <div className="home-skel-tags">
            <div className="home-skel home-skel-tag" />
            <div className="home-skel home-skel-tag" />
            <div className="home-skel home-skel-tag" />
          </div>
        </div>

        <div className="hero-right">
          <div className="home-skel home-skel-carousel">
            <div className="home-skel home-skel-carousel-badge" />
            <div className="home-skel home-skel-carousel-line" />
            <div className="home-skel home-skel-carousel-line home-skel-carousel-line--sm" />
          </div>
          <div className="hero-right-bottom">
            <div className="home-skel home-skel-matrix">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="home-skel home-skel-matrix-cell" />
              ))}
            </div>
            <div className="home-skel home-skel-events">
              <div className="home-skel home-skel-events-head" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="home-skel home-skel-event-row" />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="scroll-hint home-skel-scroll-hint">
        <div className="scroll-mouse">
          <div className="scroll-wheel" />
        </div>
      </div>
    </section>
  );
}

export function CategorySkeleton() {
  return (
    <section id="categories" className="home-skel-root" aria-hidden>
      <div className="section-inner">
        <div className="categories-header">
          <div>
            <div className="home-skel home-skel-label" />
            <div className="home-skel home-skel-section-title" />
            <div className="home-skel home-skel-line home-skel-line--section" />
          </div>
        </div>
        <div className="cat-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="home-skel home-skel-cat-card" />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedSkeleton() {
  return (
    <section id="artists" className="home-skel-root" aria-hidden>
      <div className="section-inner">
        <div className="artists-header">
          <div>
            <div className="home-skel home-skel-label" />
            <div className="home-skel home-skel-section-title" />
            <div className="home-skel home-skel-line home-skel-line--section" />
          </div>
          <div className="home-skel home-skel-btn" />
        </div>
        <div className="home-skel-bento">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="home-skel home-skel-bento-card" />
          ))}
        </div>
      </div>
    </section>
  );
}
