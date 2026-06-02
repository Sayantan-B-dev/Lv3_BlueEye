import type { Metadata } from "next";
import { getEventBySlug } from "@/lib/services/eventService";
import {
  getRegistrationCountByEvent,
  getRegistrationForUser,
} from "@/lib/services/eventRegistrationService";
import { notFound } from "next/navigation";
import EventHero from "@/components/events/EventHero";
import EventTimeline from "@/components/events/EventTimeline";
import EventRegistrationForm from "@/components/events/EventRegistrationForm";
import Link from "next/link";
import AdminEditEventButton from "@/components/ui/AdminEditEventButton";
import { pageMetadata } from "@/lib/seo/metadata";
import { eventJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };

  const description =
    event.shortDescription ||
    (event.description ? event.description.slice(0, 160) : "Join this live event on Blue Eye Entertainment.");

  return pageMetadata({
    title: event.title,
    description,
    path: `/events/${slug}`,
    image: event.coverImage,
    openGraphType: "article",
  });
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const registrationCount = await getRegistrationCountByEvent(event._id);
  const spotsLeft = event.capacity > 0 ? event.capacity - registrationCount : null;
  const registrationClosed =
    !event.registrationOpen ||
    ["Completed", "Cancelled"].includes(event.status);

  return (
    <article style={{ paddingTop: "var(--hdr-h)" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd(event)) }}
      />
      <div className="section-inner" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>

        {/* Top Header / Breadcrumbs & Admin shortcut */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--muted,#9ca3af)", display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <Link href="/events" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>Events</Link>
            <span>/</span>
            <span>{event.title}</span>
          </div>
          <AdminEditEventButton eventId={event._id.toString()} />
        </div>

        {/* Hero Banner */}
        <EventHero event={event} />

        {/* Two-column layout: LEFT = Info & Timeline Feed, RIGHT = Seating & Registration */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(360px, 38%)", gap: "3rem", alignItems: "start" }}>

          {/* LEFT — Primary Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Event Description */}
            <div>
              <h2 style={{ margin: "0 0 1rem", fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
                About the Event
              </h2>
              <div style={{ fontSize: "0.95rem", color: "var(--text2)", lineHeight: 1.75, whiteSpace: "pre-line" }}>
                {event.description || "No full description provided for this event yet."}
              </div>
            </div>

            {/* Performing Artists Lineup */}
            {event.artists && event.artists.length > 0 && (
              <div>
                <h2 style={{ margin: "0 0 1.25rem", fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
                  Performing Artists
                </h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
                  {event.artists.map((a: any) => (
                    <Link key={a._id} href={`/artists/${a.slug}`} style={{
                      display: "flex", flexDirection: "column", gap: "0.75rem", textDecoration: "none",
                      padding: "1rem", borderRadius: "1rem", background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "var(--gold,#d4a017)33";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    }}>
                      {a.media?.images?.[0] ? (
                        <img src={a.media.images[0]} alt={a.name} style={{ width: "100%", aspectRatio: "1", borderRadius: "0.75rem", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", aspectRatio: "1", borderRadius: "0.75rem", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          🎤
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>{a.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--gold,#d4a017)" }}>{a.category}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Live Updates Timeline */}
            <div>
              <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.25rem", fontWeight: 800, color: "var(--text)",
                display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span style={{ color: "var(--gold,#d4a017)" }}>✦</span>
                Event Updates
                {event.updates?.length > 0 && (
                  <span style={{ fontSize: "0.75rem", padding: "2px 8px", borderRadius: "999px",
                    background: "rgba(212,160,23,0.1)", color: "var(--gold,#d4a017)", fontWeight: 600 }}>
                    {event.updates.length}
                  </span>
                )}
              </h2>
              <EventTimeline updates={event.updates || []} />
            </div>

          </div>

          {/* RIGHT — Booking & Seating Sidebar */}
          <div style={{ position: "sticky", top: "calc(var(--hdr-h) + 1.5rem)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Event Details Card */}
            <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)", borderRadius: "1rem" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Key Details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {event.venue?.address && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text2)" }}>
                    <strong style={{ color: "var(--muted,#9ca3af)", display: "block", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>📍 Venue</strong>
                    {event.venue.name && <span style={{ fontWeight: 700, display: "block", color: "var(--text)" }}>{event.venue.name}</span>}
                    <span style={{ fontSize: "0.82rem", color: "var(--text3)" }}>{event.venue.address}</span>
                  </div>
                )}
                {event.capacity > 0 && (
                  <div style={{ fontSize: "0.85rem", color: "var(--text2)" }}>
                    <strong style={{ color: "var(--muted,#9ca3af)", display: "block", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>🎟 Capacity Status</strong>
                    <span style={{ fontWeight: 700, color: "var(--text)" }}>{registrationCount} Registered</span>
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <span style={{ fontSize: "0.82rem", color: "var(--gold,#d4a017)" }}> · {spotsLeft} tickets remaining</span>
                    )}
                    {spotsLeft !== null && spotsLeft <= 0 && <span style={{ color: "var(--crimson)", fontWeight: 700 }}> · Sold Out</span>}
                  </div>
                )}
                <div>
                  <strong style={{ color: "var(--muted,#9ca3af)", display: "block", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>🏷 Category</strong>
                  <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: "6px", background: "rgba(212,160,23,0.1)", color: "var(--gold,#d4a017)", fontSize: "0.78rem", fontWeight: 700 }}>
                    {event.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Form Card */}
            <div style={{ padding: "1.5rem", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(212,160,23,0.25)", borderRadius: "1rem", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
              <h3 style={{ margin: "0 0 1.25rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text)" }}>
                {registrationClosed ? "Registration Closed" : "Register / Request Booking"}
              </h3>
              <EventRegistrationForm
                slug={event.slug}
                closed={registrationClosed}
              />
            </div>

          </div>

        </div>
      </div>
    </article>
  );
}
