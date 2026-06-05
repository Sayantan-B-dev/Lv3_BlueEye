import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "For Artists — Join India's Premium Booking Platform",
  description: `List your profile on ${siteConfig.name} and get discovered by event organisers across India. Zero listing fees, direct bookings, and dedicated support.`,
  path: "/for-artists",
});

const perks = [
  {
    title: "Zero Listing Fees",
    desc: "Create and manage your artist profile completely free. You only pay when you book a gig through our platform.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
  {
    title: "Direct Client Communication",
    desc: "Negotiate directly with event organisers. No middlemen, no commission layers — just you and your client.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
  {
    title: "Pan-India Reach",
    desc: "Get discovered by event organisers from Mumbai to Dubai. Our platform connects you with 5,000+ events annually.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    title: "Dedicated Artist Support",
    desc: "Our team handles contract management, rider coordination, and payment collection so you can focus on your performance.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
];

const steps = [
  { step: "01", title: "Create Your Profile", desc: "Sign up and build a rich artist profile with your bio, photos, videos, audio samples, and performance details." },
  { step: "02", title: "Get Discovered", desc: "Organisers find you through category searches, city filters, and curated recommendations across the platform." },
  { step: "03", title: "Receive Booking Requests", desc: "Get direct inquiries with event details, budget, and requirements. Accept what works for you." },
  { step: "04", title: "Perform & Get Paid", desc: "Deliver an amazing performance. We handle the paperwork and ensure timely payment." },
];

export default function ForArtistsPage() {
  return (
    <div className="section-inner pt-nav" style={{ minHeight: "90vh", paddingBottom: "4rem" }}>
      <div className="page-hero">
        <div className="section-label" style={{ justifyContent: "center" }}>Artist Opportunities</div>
        <h1 className="section-title" style={{ textAlign: "center" }}>
          Grow Your Career with <span>{siteConfig.name}</span>
        </h1>
        <p>
          Join India&apos;s most trusted artist discovery platform. Get booked for weddings, corporate events,
          festivals, and private shows across the country.
        </p>
      </div>

      {/* <div className="about-stats-strip">
        <div className="about-stat-card">
          <div className="about-stat-value">20,000+</div>
          <div className="about-stat-label">Artists Onboarded</div>
        </div>
        <div className="about-stat-card">
          <div className="about-stat-value">5,000+</div>
          <div className="about-stat-label">Events Booked</div>
        </div>
        <div className="about-stat-card">
          <div className="about-stat-value">300+</div>
          <div className="about-stat-label">Cities Covered</div>
        </div>
        <div className="about-stat-card">
          <div className="about-stat-value">₹0</div>
          <div className="about-stat-label">Listing Fees</div>
        </div>
      </div> */}

      <div className="page-card">
        <h2 className="about-section-title">Why Join Us?</h2>
        <div className="about-benefit-list">
          {perks.map((item, i) => (
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

      <div className="page-card">
        <h2 className="about-section-title">How It Works</h2>
        <div className="about-benefit-list">
          {steps.map((item) => (
            <div key={item.step} className="about-benefit-item" style={{ alignItems: "center" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "rgba(0, 210, 255, 0.1)",
                  border: "1px solid rgba(0, 210, 255, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--gold)",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="page-cta-banner">
        <span className="ornament">✦ ✦ ✦</span>
        <h2>
          Ready to <em className="cta-accent">Join?</em>
        </h2>
        <p>
          Create your artist profile in minutes and start receiving booking requests from top event organisers.
        </p>
        <div className="cta-actions">
          <Link href="/contact" className="btn-outline">
            Talk to Our Team
          </Link>
        </div>
      </div>
    </div>
  );
}
