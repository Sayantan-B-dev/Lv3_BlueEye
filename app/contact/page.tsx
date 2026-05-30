import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { localBusinessJsonLd } from "@/lib/seo/jsonld";

export const metadata = pageMetadata({
  title: "Contact Us",
  description: `Get in touch with the team at ${siteConfig.name}. We are here to help you with artist booking and event entertainment requirements.`,
  path: "/contact",
});

export default function ContactPage() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";
  const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "";
  const address1 = process.env.NEXT_PUBLIC_CONTACT_ADDRESS_1 || "";
  const address2 = process.env.NEXT_PUBLIC_CONTACT_ADDRESS_2 || "";
  const twitterUrl = process.env.NEXT_PUBLIC_TWITTER_URL || "";
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "";
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";
  const youtubeUrl = process.env.NEXT_PUBLIC_YOUTUBE_URL || "";
  const twitterHandle = process.env.NEXT_PUBLIC_TWITTER_HANDLE || "";
  const whatsappNumber = process.env.WHATSAPP_PHONE_NUMBER || "";

  return (
    <div className="section-inner pt-nav" style={{ minHeight: '90vh', paddingBottom: '4rem' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd()) }}
      />

      {/* Header */}
      <div className="page-hero">
        <div className="section-label" style={{ justifyContent: 'center' }}>Get in Touch</div>
        <h1 className="section-title">Contact <span>Our Team</span></h1>
        <p>
          Have a question, need support, or want to discuss a partnership?
          We&apos;d love to hear from you.
        </p>
      </div>

      {/* Two-column grid */}
      <div className="page-grid-2">

        {/* Contact Information */}
        <div className="page-card">
          <h2 className="page-card-heading">Contact Information</h2>

          <div className="contact-items-list">
            {/* Email */}
            <div className="contact-item">
              <div className="contact-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <div className="contact-item-label">Email Address</div>
                <a href={`mailto:${email}`} className="contact-link">{email}</a>
              </div>
            </div>

            {/* Phone */}
            <div className="contact-item">
              <div className="contact-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </div>
              <div>
                <div className="contact-item-label">Phone Support</div>
                <a href={`tel:${phone.replace(/\s+/g, '')}`} className="contact-link">{phone}</a>
              </div>
            </div>


            {/* Address */}
            <div className="contact-item">
              <div className="contact-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {address1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <span className="contact-item-label" style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.75px', fontWeight: '600' }}>Address 1</span>
                      <span className="contact-plain" style={{ lineHeight: '1.6' }}>{address1}</span>
                    </div>
                  )}
                  {address2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <span className="contact-item-label" style={{ fontSize: '0.8rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.75px', fontWeight: '600' }}>Address 2</span>
                      <span className="contact-plain" style={{ lineHeight: '1.6' }}>{address2}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Directory */}
        <div className="page-card">
          <h2 className="page-card-heading">Follow Us</h2>
          <div className="social-grid">
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="social-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="2" width="20" height="20" rx="5"/>
                <circle cx="12" cy="12" r="5"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
              <span className="social-name">Instagram</span>
              <span className="social-sub">Follow updates</span>
            </a>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="social-card">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span className="social-name">Twitter / X</span>
              <span className="social-sub">{twitterHandle}</span>
            </a>
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="social-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              <span className="social-name">Facebook</span>
              <span className="social-sub">Connect with us</span>
            </a>
            <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="social-card">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M22 8s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C15.4 4 12 4 12 4s-3.4 0-5.8.2c-.6.1-1.9.1-3 1.3C2.3 6 2 8 2 8S1.7 10.3 1.7 12.5v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C8.4 23 12 23 12 23s3.4 0 5.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.4v-2.1C22.3 10.3 22 8 22 8z"/>
                <polygon points="10,15 15,12 10,9 10,15" fill="currentColor" stroke="none"/>
              </svg>
              <span className="social-name">YouTube</span>
              <span className="social-sub">Watch live shows</span>
            </a>
                        {/* WhatsApp Click-to-Chat */}
            {whatsappNumber && (
              <a href={`https://wa.me/${whatsappNumber}?text=Hi%20there`} target="_blank" rel="noopener noreferrer" className="social-card2">
                <div className="contact-icon-wrap" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                  </svg>
                </div>
                <div>
                  <div className="contact-item-label">WhatsApp Us</div>
                  <p
                    className="contact-link"
                    style={{ color: 'var(--gold)' }}
                  >
                    Click to Chat
                  </p>
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Booking CTA */}
      <div className="page-cta-banner">
        <span className="ornament">✦ ✦ ✦</span>
        <h2>
          Looking to Book an <em className="cta-accent">Artist?</em>
        </h2>
        <p>
          For pricing quotes, artist availability, and rider coordination — head over to our dedicated Artist Booking Desk.
        </p>
        <div className="cta-actions">
          <Link href="/book-artist" className="btn-primary">
            Proceed to Booking Desk ✦
          </Link>
        </div>
      </div>
    </div>
  );
}
