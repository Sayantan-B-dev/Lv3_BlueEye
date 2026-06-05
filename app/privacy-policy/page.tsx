"use client";

import { Suspense } from "react";
import Link from "next/link";
import EmailForm from "@/components/forms/EmailForm";

const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "theblueeyeentertainment@gmail.com";
const phone = process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 91379 52580";
const address = "43W. Bediyadanga masjid bari bye lane, Ground Floor, Kolkata";

const sections = [
  {
    title: "Information We Collect",
    content: `We collect information you provide directly when you create an account, submit an inquiry, book an artist, or contact us. This may include your name, email address, phone number, event details, and payment information.

We also automatically collect certain technical information when you visit our platform, including your IP address, browser type, device information, and browsing behaviour through cookies and similar technologies.`,
  },
  {
    title: "How We Use Your Information",
    content: `We use your information to:

• Facilitate artist bookings and event coordination
• Communicate with you about your inquiries, bookings, and account
• Improve and personalise your experience on our platform
• Send important service updates and administrative messages
• Comply with legal obligations and prevent fraud

We do not sell your personal information to third parties.`,
  },
  {
    title: "Information Sharing",
    content: `We may share your information with:

• Artists and their management teams to facilitate bookings
• Payment processors to handle transactions securely
• Service providers who help us operate our platform
• Law enforcement or regulatory bodies when required by law

All third-party providers are bound by confidentiality agreements and are only permitted to use your data for the specific services they provide.`,
  },
  {
    title: "Data Security",
    content: `We implement industry-standard security measures to protect your personal information, including SSL encryption, secure data storage, and regular security audits. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "Cookies",
    content: `Our platform uses cookies to enhance your browsing experience, analyse site traffic, and support our marketing efforts. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our platform.`,
  },
  {
    title: "Your Rights",
    content: `You have the right to:

• Access the personal data we hold about you
• Request correction or deletion of your data
• Withdraw consent for data processing
• Opt out of marketing communications
• Request a copy of your data in a portable format

To exercise any of these rights, please contact us using the information below.`,
  },
  {
    title: "Third-Party Links",
    content: `Our platform may contain links to third-party websites, including social media platforms and payment gateways. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.`,
  },
  {
    title: "Changes to This Policy",
    content: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.`,
  },
  {
    title: "Contact Us",
    content: `If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please don't hesitate to reach out.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="section-inner pt-nav" style={{ minHeight: "90vh", paddingBottom: "4rem" }}>
      <div className="page-hero">
        <div className="section-label" style={{ justifyContent: "center" }}>Legal</div>
        <h1 className="section-title" style={{ textAlign: "center" }}>
          Privacy <span>Policy</span>
        </h1>
        <p>
          Last updated: June 2026. Your privacy matters to us. This policy outlines how we collect,
          use, and safeguard your personal information.
        </p>
      </div>

      <div className="page-card">
        {sections.slice(0, -1).map((section, i) => (
          <div
            key={i}
            style={{
              marginBottom: "2.5rem",
              paddingBottom: "2.5rem",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <h2
              style={{
                fontSize: "1.15rem",
                fontWeight: 700,
                color: "var(--gold)",
                marginBottom: "1rem",
              }}
            >
              {section.title}
            </h2>
            {section.content.split("\n\n").map((paragraph, j) => (
              <p
                key={j}
                style={{
                  color: "var(--text2)",
                  lineHeight: 1.8,
                  marginBottom: j < section.content.split("\n\n").length - 1 ? "1rem" : 0,
                }}
              >
                {paragraph.includes("•") ? (
                  <>
                    {paragraph.split("\n").map((line, k) => (
                      <span key={k}>
                        {k > 0 && <br />}
                        {line.startsWith("• ") ? (
                          <span style={{ display: "block", paddingLeft: "1rem", marginBottom: "0.25rem" }}>{line}</span>
                        ) : (
                          line
                        )}
                      </span>
                    ))}
                  </>
                ) : (
                  paragraph
                )}
              </p>
            ))}
          </div>
        ))}

        {/* Contact Us Section */}
        <div>
          <h2
            style={{
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "var(--gold)",
              marginBottom: "1rem",
            }}
          >
            Contact Us
          </h2>
          <p style={{ color: "var(--text2)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
            If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please don&apos;t hesitate to reach out.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "1.5rem",
              padding: "1.25rem",
              borderRadius: "16px",
              border: "1px solid var(--border)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.25rem" }}>Email</div>
              <a href={`mailto:${email}`} style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>{email}</a>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.25rem" }}>Phone</div>
              <a href={`tel:${phone.replace(/\s+/g, "")}`} style={{ color: "var(--gold)", textDecoration: "none", fontWeight: 600 }}>{phone}</a>
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: "0.25rem" }}>Address</div>
              <div style={{ color: "var(--text2)", lineHeight: 1.5 }}>{address}</div>
            </div>
          </div>
          <Link href="/contact" className="btn-primary" style={{ textDecoration: "none", display: "inline-flex" }}>
            Contact Us Page →
          </Link>
        </div>
      </div>

      <Suspense fallback={<div style={{ marginTop: "2rem", textAlign: "center", padding: "2rem", color: "var(--text3)" }}>Loading form...</div>}>
        <EmailForm variant="contact" />
      </Suspense>
    </div>
  );
}
