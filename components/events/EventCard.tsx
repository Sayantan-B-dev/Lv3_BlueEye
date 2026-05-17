import Link from "next/link";
import EventStatusBadge from "./EventStatusBadge";

export default function EventCard({ event }: { event: any }) {
  const date = event.startDate
    ? new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "TBA";

  return (
    <Link href={`/events/${event.slug}`} className="reveal" style={{
      display: "flex", flexDirection: "column",
      background: "var(--card-bg, rgba(255,255,255,0.04))",
      border: "1px solid var(--border, rgba(255,255,255,0.08))",
      borderRadius: "1rem", overflow: "hidden",
      transition: "transform 0.25s ease, box-shadow 0.25s ease",
      textDecoration: "none", color: "inherit",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
      (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 40px rgba(0,0,0,0.35)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.transform = "";
      (e.currentTarget as HTMLElement).style.boxShadow = "";
    }}>
      {/* Cover Image */}
      <div style={{ position: "relative", height: 200, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
        {event.coverImage ? (
          <img src={event.coverImage} alt={event.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gold,#d4a017)" strokeWidth="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
          </div>
        )}
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <EventStatusBadge status={event.status} />
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
        <div style={{ fontSize: "0.72rem", color: "var(--gold,#d4a017)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          {event.category}
        </div>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, lineHeight: 1.3, color: "var(--text)" }}>
          {event.title}
        </h3>
        {event.shortDescription && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--muted,#9ca3af)", lineHeight: 1.5,
            overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
            {event.shortDescription}
          </p>
        )}
        <div style={{ marginTop: "auto", paddingTop: "0.75rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--muted,#9ca3af)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
            </svg>
            {date}
          </div>
          {event.venue?.city && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--muted,#9ca3af)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {event.venue.city}{event.venue.state ? `, ${event.venue.state}` : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
