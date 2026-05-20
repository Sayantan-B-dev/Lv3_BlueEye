import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export const metadata = {
  title: `About Us | ${siteConfig.name}`,
  description: siteConfig.longDescription,
};

const benefits = [
  {
    title: "100% Verified Talent",
    desc: "Every artist profile is thoroughly vetted for authenticity, professional capability, and performance quality before being listed on our platform.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  {
    title: "Secure & Direct Booking",
    desc: "Direct communication with artist management guarantees transparent pricing, secure payments, and zero hidden charges.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
  {
    title: "Dedicated Logistics Support",
    desc: "Our experienced team handles all rider fulfilment, contract negotiation, technical requirements, and on-ground coordination.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    title: "Transparent Pricing",
    desc: "No middlemen, no inflated quotes. Get competitive pricing directly from artist managers with a full cost breakdown.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

const stats = [
  { value: "20,000+", label: "Verified Artists" },
  { value: "5,000+", label: "Events Delivered" },
  { value: "300+", label: "Cities Covered" },
  { value: "24/7", label: "Concierge Support" },
];

export default function AboutPage() {
  return (
    <div className="section-inner pt-nav" style={{ minHeight: "90vh", paddingBottom: "4rem" }}>

      {/* Hero Header */}
      <div className="page-hero">
        <div className="section-label" style={{ justifyContent: "center" }}>Who We Are</div>
        <h1 className="section-title" style={{ textAlign: "center" }}>
          About <span>{siteConfig.name}</span>
        </h1>
        <p>
          India&apos;s most trusted platform for discovering and booking world-class artists —
          from Bollywood headliners to indie gems.
        </p>
      </div>

      {/* Story */}
      <div className="page-card about-story">
        <h2 className="about-section-title">Our Story</h2>
        <p>
          Established in 2018, <strong style={{ color: "var(--text)" }}>{siteConfig.name}</strong> has
          grown to become India&apos;s leading platform for booking premium entertainment. We bridge the gap
          between event organisers and top-tier talent — making the booking process transparent, fast, and
          completely hassle-free.
        </p>
        <p>
          Our curated roster features over <strong style={{ color: "var(--text)" }}>20,000 verified artists</strong> across
          multiple categories including singers, instrumentalists, stand-up comedians, DJs, rappers, bands,
          Bollywood celebrities, and TV personalities.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="about-mission-grid">
        <div className="about-mission-card">
          <div className="about-mission-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <h3>Our Mission</h3>
          <p>
            To simplify and democratize the artist booking industry in India. We remove unnecessary
            intermediaries, establish transparent pricing, and provide a secure marketplace for both
            event hosts and artists.
          </p>
        </div>

        <div className="about-mission-card">
          <div className="about-mission-card-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <h3>Our Vision</h3>
          <p>
            To become the ultimate global destination for live entertainment booking — empowering
            artists to showcase their talent while helping organisers create unforgettable experiences.
          </p>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="page-card">
        <h2 className="about-section-title">Why Choose {siteConfig.shortName}?</h2>
        <div className="about-benefit-list">
          {benefits.map((item, i) => (
            <div key={i} className="about-benefit-item">
              <div className="about-benefit-icon">{item.icon}</div>
              <div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Strip */}
      <div className="about-stats-strip">
        {stats.map((stat, i) => (
          <div key={i} className="about-stat-card">
            <div className="about-stat-value">{stat.value}</div>
            <div className="about-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="page-cta-banner">
        <h2>Ready to Make Your Event <em className="cta-accent">Unforgettable?</em></h2>
        <p>Connect with our booking experts today and bring the best artists in India to your stage.</p>
        <div className="cta-actions">
          <Link href="/book-artist" className="btn-primary">Book an Artist</Link>
          <Link href="/contact" className="btn-outline">Contact Support</Link>
        </div>
      </div>

    </div>
  );
}
