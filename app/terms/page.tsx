import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import EmailForm from "@/components/forms/EmailForm";

export const metadata: Metadata = pageMetadata({
  title: "Terms of Service — Booking & Platform Usage",
  description: `Review the terms and conditions for using ${siteConfig.name}. Covers artist bookings, user obligations, payments, cancellations, and platform usage.`,
  path: "/terms",
});

const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "theblueeyeentertainment@gmail.com";

const sections = [
  {
    title: "Acceptance of Terms",
    content: `By accessing or using ${siteConfig.name} ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform.

We reserve the right to update these terms at any time. Changes will be posted on this page with an updated effective date. Continued use of the Platform after changes constitutes acceptance of the revised terms.`,
  },
  {
    title: "Platform Description",
    content: `${siteConfig.name} is an online marketplace that connects event organisers, wedding planners, corporate clients, and individuals ("Clients") with performers, artists, and entertainment professionals ("Artists"). We facilitate discovery, communication, and booking arrangements between Clients and Artists.

We are a booking facilitation platform, not the employer or agent of any Artist listed on the Platform. All bookings are direct agreements between the Client and the Artist.`,
  },
  {
    title: "User Accounts",
    content: `To access certain features, you may be required to create an account. You are responsible for:

• Maintaining the confidentiality of your account credentials
• All activities that occur under your account
• Providing accurate, current, and complete information

You must be at least 18 years old to create an account. Accounts registered by minors will be terminated upon discovery.`,
  },
  {
    title: "Bookings & Payments",
    content: `All booking requests are subject to Artist availability and acceptance. A booking is confirmed only when both parties have agreed to the terms in writing.

Payment terms, including deposits, milestones, and final payments, will be specified in the booking agreement. Unless otherwise agreed:

• A non-refundable deposit may be required to secure the booking
• The balance is due as per the agreed payment schedule
• All payments shall be made through the Platform's designated payment methods

Prices listed are in Indian Rupees (INR) unless otherwise stated and are exclusive of applicable taxes.`,
  },
  {
    title: "Cancellations & Refunds",
    content: `Cancellation policies may vary by Artist and are specified in individual booking agreements. General guidelines include:

• Client-initiated cancellations: Refunds, if any, will be processed according to the Artist's stated cancellation policy
• Artist-initiated cancellations: The Client shall receive a full refund of all amounts paid
• Force majeure events: Either party may cancel without penalty in case of unforeseen circumstances beyond reasonable control

We encourage all Clients to review the cancellation policy before confirming a booking.`,
  },
  {
    title: "User Conduct",
    content: `You agree not to:

• Use the Platform for any unlawful purpose
• Submit false, misleading, or fraudulent information
• Harass, abuse, or harm other users, including Artists
• Attempt to circumvent the Platform's booking system or payment processes
• Interfere with the Platform's security or performance
• Collect user data without consent

Violation of these rules may result in account suspension or legal action.`,
  },
  {
    title: "Intellectual Property",
    content: `All content on the Platform, including text, graphics, logos, images, and software, is the property of ${siteConfig.name} or its licensors and is protected by applicable intellectual property laws.

You may not reproduce, distribute, modify, or create derivative works without prior written consent. Artist profile images and media are used with permission and remain the property of the respective Artists.`,
  },
  {
    title: "Limitation of Liability",
    content: `${siteConfig.name} acts solely as a facilitator and is not liable for:

• The quality, safety, or legality of Artist performances
• Disputes arising between Clients and Artists
• Losses resulting from booking cancellations or changes
• Indirect, incidental, or consequential damages

Our total liability is limited to the fees paid for the specific booking giving rise to the claim.`,
  },
  {
    title: "Termination",
    content: `We reserve the right to suspend or terminate access to the Platform at our sole discretion, without notice, for conduct that we believe violates these terms or is harmful to other users, the Platform, or third parties.

Upon termination, your right to use the Platform ceases immediately. Provisions regarding payments, intellectual property, and limitation of liability shall survive termination.`,
  },
  {
    title: "Governing Law",
    content: `These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Kolkata, West Bengal.`,
  },
  {
    title: "Contact Us",
    content: `If you have any questions about these Terms of Service, please contact us.`,
  },
];

export default function TermsPage() {
  return (
    <div className="section-inner pt-nav" style={{ minHeight: "90vh", paddingBottom: "4rem" }}>
      <div className="page-hero">
        <div className="section-label" style={{ justifyContent: "center" }}>Legal</div>
        <h1 className="section-title" style={{ textAlign: "center" }}>
          Terms of <span>Service</span>
        </h1>
        <p>
          Last updated: June 2026. Please read these terms carefully before using the Platform.
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
            If you have any questions about these Terms of Service, please reach out to us.
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
