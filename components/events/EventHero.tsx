import EventStatusBadge from "./EventStatusBadge";
import Link from "next/link";

export default function EventHero({ event }: { event: any }) {
  const startDate = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "TBA";
  const endDate = event.endDate
    ? new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div style={{ position: "relative", borderRadius: "1.25rem", overflow: "hidden", marginBottom: "2.5rem" }}>
      {/* Cover */}
      <div style={{ height: "clamp(220px, 35vw, 380px)", background: "rgba(255,255,255,0.04)", position: "relative" }}>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: "linear-gradient(135deg,rgba(212,160,23,0.15),rgba(212,160,23,0.03))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#d4a017)" strokeWidth="1">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
        )}
        {/* Gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
        }} />
        {/* Status badge */}
        <div style={{ position: "absolute", top: 20, left: 20 }}>
          <EventStatusBadge status={event.status} />
        </div>
      </div>

      {/* Info overlay at bottom */}
      <div style={{ padding: "1.75rem 2rem", background: "rgba(255,255,255,0.02)", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: "0.72rem", color: "var(--gold,#d4a017)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
          {event.category}
        </div>
        <h1 style={{ margin: "0 0 1rem", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 800, lineHeight: 1.2, color: "var(--text)" }}>
          {event.title}
        </h1>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--muted,#9ca3af)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#d4a017)" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            <span>{startDate}{endDate ? ` → ${endDate}` : ""}</span>
          </div>

          {event.venue?.name && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--muted,#9ca3af)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#d4a017)" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{event.venue.name}{event.venue.city ? `, ${event.venue.city}` : ""}</span>
            </div>
          )}

          {event.artists?.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: "var(--muted,#9ca3af)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#d4a017)" strokeWidth="2">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/>
              </svg>
              <span>{event.artists.length} Artist{event.artists.length !== 1 ? "s" : ""} Performing</span>
            </div>
          )}
        </div>

        {event.tags?.length > 0 && (
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "1rem" }}>
            {event.tags.map((tag: string) => (
              <span key={tag} style={{
                fontSize: "0.72rem", padding: "3px 10px", borderRadius: "999px",
                background: "rgba(212,160,23,0.1)", color: "var(--gold,#d4a017)",
                border: "1px solid rgba(212,160,23,0.2)",
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
