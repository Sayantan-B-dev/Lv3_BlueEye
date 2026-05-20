import HomeDynamicContent from "@/components/home/HomeDynamicContent";
import StatsBar from "@/components/home/StatsBar";
import TestimonialsMarquee from "@/components/home/TestimonialsMarquee";
import PlasmaWave from "@/components/react-bits/PlasmaWave";

export default async function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Client-Side Hydration Controller with Golden Pulsing skeletons */}
      <HomeDynamicContent />

      {/* Infinite Scrolling Premium Gold Marquee Row */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <div className="marquee-item">100% Verified Celebrity Artists</div>
          <div className="marquee-item">Direct Secure Bookings</div>
          <div className="marquee-item">24/7 Reserved Concierge Assistance</div>
          <div className="marquee-item">India's Largest Booking Hub</div>
          <div className="marquee-item">5000+ Staged Performances</div>
          <div className="marquee-item">Transparent Lowest Commission</div>
          {/* Double list for seamless perpetual loop */}
          <div className="marquee-item">100% Verified Celebrity Artists</div>
          <div className="marquee-item">Direct Secure Bookings</div>
          <div className="marquee-item">24/7 Reserved Concierge Assistance</div>
          <div className="marquee-item">India's Largest Booking Hub</div>
          <div className="marquee-item">5000+ Staged Performances</div>
          <div className="marquee-item">Transparent Lowest Commission</div>
        </div>
      </div>

      {/* How it Works */}
      <section id="how">
        <div className="section-inner">
          <div className="how-content">
            <div className="how-text reveal visible">
              <div className="section-label">Simple &amp; Fast</div>
              <h2 className="section-title">Book in <span>3 Easy Steps</span></h2>
              <p className="section-desc" style={{ marginTop: '.5rem' }}>From discovery to performance — we make the entire booking experience seamless and stress-free.</p>
              <br /><br />
              <a href="/book-artist" className="btn-primary btn-lg">Start Booking ✦</a>
            </div>

            <div className="steps">
              <div className="step reveal visible" style={{ transitionDelay: '.1s' }}>
                <div className="step-num">01</div>
                <div className="step-body">
                  <h4>Discover the Perfect Artist</h4>
                  <p>Browse 20,000+ artists across all genres and cities. Filter by category, location, budget, and event type to find your ideal performer.</p>
                </div>
              </div>
              <div className="step reveal visible" style={{ transitionDelay: '.2s' }}>
                <div className="step-num">02</div>
                <div className="step-body">
                  <h4>Get a Competitive Quote</h4>
                  <p>Submit your enquiry and our dedicated team will revert with the best possible pricing, availability, and customized packages.</p>
                </div>
              </div>
              <div className="step reveal visible" style={{ transitionDelay: '.3s' }}>
                <div className="step-num">03</div>
                <div className="step-body">
                  <h4>Confirm &amp; Celebrate</h4>
                  <p>Lock the artist with a confirmed booking. We handle all logistics, contracts, and rider management — you just enjoy the show.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <StatsBar />

      {/* Testimonials */}
      <section id="testimonials">
        <div className="section-inner">
          <div className="reveal visible" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>Client Stories</div>
            <h2 className="section-title" style={{ textAlign: 'center' }}>What They <span>Say About Us</span></h2>
          </div>

          <div style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
            <TestimonialsMarquee />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section id="cta-banner" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 ,opacity:0.5}}>
          <PlasmaWave
            colors={['#00d2ff', '#0055ff']}
            speed1={0.2}
            speed2={0.2}
            focalLength={2}
            bend1={1}
            bend2={0.5}
            dir2={1}
            rotationDeg={0}
          />
        </div>
        <div className="cta-inner reveal visible" style={{ zIndex: 1 }}>
          <div className="cta-text">
            <span className="ornament">✦ ✦ ✦</span>
            <h2>Ready to Make Your <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,var(--gold),var(--saffron))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Event Unforgettable?</em></h2>
            <p>Connect with our booking experts today and bring the best artists in India to your stage — weddings, corporate events, college fests &amp; more.</p>
          </div>
          <div className="cta-actions">
            <a href="/artists" className="btn-primary btn-lg">Book an Artist ✦</a>
            <a href="/contact" className="btn-outline btn-lg">Talk to Us →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
