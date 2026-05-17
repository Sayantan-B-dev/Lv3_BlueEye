import { getEventBySlug } from "@/lib/services/eventService";
import { getRegistrationCountByEvent } from "@/lib/services/eventRegistrationService";
import { notFound } from "next/navigation";
import EventHero from "@/components/events/EventHero";
import EventTimeline from "@/components/events/EventTimeline";
import EventRegistrationForm from "@/components/events/EventRegistrationForm";
import Link from "next/link";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: `${event.title} | BlueEye Events`,
    description: event.shortDescription || event.description?.slice(0, 150) || "",
    openGraph: { images: event.coverImage ? [event.coverImage] : [] },
  };
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
    <div style={{ paddingTop: "var(--hdr-h)" }}>
      <div className="section-inner" style={{ paddingTop: "2rem", paddingBottom: "5rem" }}>

        {/* Breadcrumb */}
        <div style={{ marginBottom: "1.5rem", fontSize: "0.8rem", color: "var(--muted,#9ca3af)", display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <Link href="/events" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>Events</Link>
          <span>/</span>
          <span>{event.title}</span>
        </div>

        {/* Hero */}
        <EventHero event={event} />

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr min(360px, 38%)", gap: "2.5rem", alignItems: "start" }}>

          {/* LEFT — Timeline */}
          <div>
            <h2 style={{ margin: "0 0 1.5rem", fontSize: "1.15rem", fontWeight: 700, color: "var(--text)",
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

          {/* RIGHT — Info + Registration */}
          <div style={{ position: "sticky", top: "calc(var(--hdr-h) + 1.5rem)", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

            {/* Info card */}
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.85rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>Event Details</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {event.venue?.address && (
                  <div style={{ fontSize: "0.82rem", color: "var(--muted,#9ca3af)" }}>
                    <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.15rem" }}>📍 Venue</strong>
                    {event.venue.name && <span>{event.venue.name}, </span>}
                    {event.venue.address}
                  </div>
                )}
                {event.capacity > 0 && (
                  <div style={{ fontSize: "0.82rem", color: "var(--muted,#9ca3af)" }}>
                    <strong style={{ color: "var(--text)", display: "block", marginBottom: "0.15rem" }}>🎟 Capacity</strong>
                    {registrationCount} registered
                    {spotsLeft !== null && spotsLeft > 0 && ` · ${spotsLeft} spots left`}
                    {spotsLeft !== null && spotsLeft <= 0 && <span style={{ color: "#f87171" }}> · Full</span>}
                  </div>
                )}
                {event.description && (
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem", color: "var(--muted,#9ca3af)", lineHeight: 1.65 }}>
                    {event.description}
                  </p>
                )}
              </div>
            </div>

            {/* Artists lineup */}
            {event.artists?.length > 0 && (
              <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.85rem" }}>
                <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>
                  🎤 Performing Artists
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {event.artists.map((a: any) => (
                    <Link key={a._id} href={`/artists/${a.slug}`} style={{
                      display: "flex", alignItems: "center", gap: "0.6rem", textDecoration: "none",
                      padding: "0.4rem 0.5rem", borderRadius: "0.4rem",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      {a.media?.images?.[0] && (
                        <img src={a.media.images[0]} alt={a.name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                      )}
                      <div>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--muted,#9ca3af)" }}>{a.category}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Registration form */}
            <div style={{ padding: "1.25rem", background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(212,160,23,0.2)", borderRadius: "0.85rem" }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text)" }}>
                {registrationClosed ? "Registration Closed" : "Register for This Event"}
              </h3>
              <EventRegistrationForm slug={event.slug} closed={registrationClosed} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
