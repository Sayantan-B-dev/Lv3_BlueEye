import HomeDynamicContent from "@/components/home/HomeDynamicContent";
import StatsBar from "@/components/home/StatsBar";
import TestimonialsMarquee from "@/components/home/TestimonialsMarquee";
import dynamic from "next/dynamic";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { connectToDatabase } from "@/lib/db/connect";
import Artist from "@/lib/models/Artist";
import Event from "@/lib/models/Event";
import { categoryPath, cityPath } from "@/lib/seo/slugs";
import { getDistinctCategories, getDistinctCities } from "@/lib/services/searchService";
import { getHomePageData } from "@/lib/services/homeDataService";

const PlasmaWave = dynamic(() => import("@/components/react-bits/PlasmaWave"));

export const metadata = pageMetadata({
  title: "Book Celebrity Artists — Singers, DJs, Comedians & More in India",
  description: siteConfig.description,
  path: "/",
});

export const revalidate = 86400; // 24 hours

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How do I book an artist on Blue Eye Entertainment?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Browse our curated list of artists, select one that fits your event, and submit a booking enquiry. Our team will revert with pricing and availability within 24 hours.",
      },
    },
    {
      "@type": "Question",
      name: "What types of artists can I book?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can book Bollywood singers, DJs, stand-up comedians, live bands, folk artists, emcees, anchors, dancers, and many more performers for weddings, corporate events, and private parties across India.",
      },
    },
    {
      "@type": "Question",
      name: "Is artist booking on Blue Eye Entertainment affordable?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Blue Eye Entertainment offers transparent, lowest-commission pricing. You get direct access to artists with no hidden fees, making it the most affordable premium artist booking platform in India.",
      },
    },
    {
      "@type": "Question",
      name: "Which cities does Blue Eye Entertainment serve?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We serve all major Indian cities including Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Jaipur, Lucknow, Ahmedabad, and many more.",
      },
    },
    {
      "@type": "Question",
      name: "How does Blue Eye verify artists?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Every artist undergoes a multi-step verification process including identity verification, past performance review, and client reference checks. Only verified artists receive the '100% Verified' badge.",
      },
    },
    {
      "@type": "Question",
      name: "What happens after I submit a booking enquiry?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Our team reviews your enquiry within 24 hours and reaches out with artist availability, pricing options, and package details. You can compare options and confirm the booking through your dashboard.",
      },
    },
    {
      "@type": "Question",
      name: "Are there any hidden fees?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. The price you see and agree upon is the final price. There are no booking fees, service charges, or hidden commissions added after confirmation.",
      },
    },
    {
      "@type": "Question",
      name: "How far in advance should I book?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We recommend booking at least 4-6 weeks in advance for popular artists, especially during wedding season. We also accommodate last-minute bookings — reach out and we will check availability.",
      },
    },
    {
      "@type": "Question",
      name: "What payment methods are accepted?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We accept all major payment methods including UPI, net banking, credit/debit cards, and bank transfers. For corporate bookings, we also support invoice-based payments with GST billing.",
      },
    },
    {
      "@type": "Question",
      name: "Do you have packages for college fests?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, we offer special college fest packages with discounted pricing for student-run events — from headliner performers to DJ nights and comedy shows.",
      },
    },
  ],
};

export default async function HomePage() {
  await connectToDatabase();
  
  const [totalArtists, totalEvents, topCategories, topCities, homeData] = await Promise.all([
    Artist.countDocuments().catch(() => 0),
    Event.countDocuments().catch(() => 0),
    getDistinctCategories().catch(() => [] as string[]),
    getDistinctCities().catch(() => [] as string[]),
    getHomePageData().catch(() => null),
  ]);

  const artistsText = totalArtists > 0 ? `${totalArtists}+` : "20,000+";
  const eventsText = totalEvents > 0 ? `${totalEvents}+` : "5000+";

  // Limit to top cities/categories for homepage display
  const featuredCities = topCities.slice(0, 12);
  const featuredCategories = topCategories.slice(0, 10);

  return (
    <div className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {/* Homepage dynamic sections with server-provided initial data */}
      <HomeDynamicContent initialData={homeData} />

      {/* Infinite Scrolling Premium Gold Marquee Row */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          <div className="marquee-item">100% Verified Celebrity Artists</div>
          <div className="marquee-item">Direct Secure Bookings</div>
          <div className="marquee-item">24/7 Reserved Concierge Assistance</div>
          <div className="marquee-item">India's Largest Booking Hub</div>
          <div className="marquee-item">{eventsText} Staged Performances</div>
          <div className="marquee-item">Transparent Lowest Commission</div>
          {/* Double list for seamless perpetual loop */}
          <div className="marquee-item">100% Verified Celebrity Artists</div>
          <div className="marquee-item">Direct Secure Bookings</div>
          <div className="marquee-item">24/7 Reserved Concierge Assistance</div>
          <div className="marquee-item">India's Largest Booking Hub</div>
          <div className="marquee-item">{eventsText} Staged Performances</div>
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
                  <p>Browse {artistsText} artists across all genres and cities. Filter by category, location, budget, and event type to find your ideal performer.</p>
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

      <StatsBar initialArtists={totalArtists} initialCities={topCities.length} />

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

      {/* FAQs */}
      <section className="faq-section">
        <div className="faq-container">
          <div className="reveal visible" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div className="section-label" style={{ justifyContent: 'center' }}>Got Questions?</div>
            <h2 className="section-title" style={{ textAlign: 'center' }}>Frequently Asked <span>Questions</span></h2>
          </div>
          <div className="faq-list">
            {faqSchema.mainEntity.map((faq, index) => (
              <details className="faq-details" key={index}>
                <summary className="faq-summary">
                  {faq.name}
                </summary>
                <div className="faq-content">
                  <p>{faq.acceptedAnswer.text}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Top Cities & Categories Internal Hub */}
      {(featuredCities.length > 0 || featuredCategories.length > 0) && (
        <section style={{ padding: '4rem 0', borderTop: '1px solid var(--border)' }}>
          <div className="section-inner">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>

              {featuredCategories.length > 0 && (
                <div>
                  <h2 className="section-title" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', marginBottom: '1.25rem' }}>
                    Browse by <span>Category</span>
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {featuredCategories.map((cat) => (
                      <a
                        key={cat}
                        href={categoryPath(cat)}
                        style={{
                          padding: '0.4rem 1rem',
                          background: 'rgba(0,210,255,0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '100px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text2)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          fontFamily: 'var(--font-primary)',
                        }}
                      >
                        {cat} Artists
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {featuredCities.length > 0 && (
                <div>
                  <h2 className="section-title" style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', marginBottom: '1.25rem' }}>
                    Book Artists by <span>City</span>
                  </h2>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                    {featuredCities.map((city) => (
                      <a
                        key={city}
                        href={cityPath(city)}
                        style={{
                          padding: '0.4rem 1rem',
                          background: 'rgba(0,210,255,0.05)',
                          border: '1px solid var(--border)',
                          borderRadius: '100px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          color: 'var(--text2)',
                          textDecoration: 'none',
                          transition: 'all 0.2s ease',
                          fontFamily: 'var(--font-primary)',
                        }}
                      >
                        Artists in {city}
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Artist CTA — Apply as an Artist */}
      <section style={{ padding: '5rem 0' }}>
        <div className="section-inner">
          <div style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '32px',
            padding: 'clamp(2rem, 4vw, 4rem)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
          }}>
            <div>
              <div className="section-label">For Artists</div>
              <h2 className="section-title" style={{ marginTop: '1rem' }}>
                Join India's Premium <span>Artist Network</span>
              </h2>
              <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginTop: '1rem', maxWidth: '480px' }}>
                Get discovered by top event organisers across the country. Create your profile, showcase your work, and receive direct booking inquiries — all with zero listing fees.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
                <a href="/for-artists" className="btn-primary btn-lg">
                  Apply as an Artist →
                </a>
                <a href="/for-artists" className="btn-outline btn-lg">
                  Learn More
                </a>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {[
                { icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                ), title: 'Zero Listing Fees', desc: 'Create and manage your profile completely free. No upfront costs, no hidden charges.' },
                { icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                ), title: 'Direct Client Inquiries', desc: 'Get booking requests straight from event organisers with full event details and budget.' },
                { icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                ), title: 'Pan-India Reach', desc: 'Get discovered by organisers from Mumbai to Dubai. Expand your network across borders.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(0, 210, 255, 0.08)', border: '1px solid rgba(0, 210, 255, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)',
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.15rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text3)', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
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
