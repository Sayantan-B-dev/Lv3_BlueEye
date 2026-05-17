import { getEvents, getDistinctEventCategories } from "@/lib/services/eventService";
import EventCard from "@/components/events/EventCard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events | BlueEye",
  description: "Browse upcoming live events, concerts, and shows managed by BlueEye.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string }>;
}) {
  const { status, category } = await searchParams;

  const [result, categories] = await Promise.all([
    getEvents({ status, category, limit: 24 }),
    getDistinctEventCategories(),
  ]);

  const { events } = result as { events: any[] };

  const statusTabs = ["All", "Upcoming", "Ongoing", "Completed", "Cancelled"];

  return (
    <div className="section-inner" style={{ paddingTop: "calc(var(--hdr-h) + 2.5rem)", paddingBottom: "5rem" }}>

      {/* Header */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div className="section-label">Live & Upcoming</div>
        <h1 className="section-title">
          Explore <span>Events</span>
        </h1>
        <p className="section-desc" style={{ maxWidth: 560 }}>
          From headline concerts to intimate performances — discover and register for events powered by BlueEye.
        </p>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {statusTabs.map(tab => {
          const active = (tab === "All" && !status) || tab === status;
          const href = tab === "All" ? "/events" : `/events?status=${tab}`;
          return (
            <Link key={tab} href={href} style={{
              padding: "6px 16px", borderRadius: "999px", fontSize: "0.82rem", fontWeight: 600,
              textDecoration: "none", transition: "all 0.15s",
              background: active ? "var(--gold,#d4a017)" : "rgba(255,255,255,0.05)",
              color: active ? "#000" : "var(--muted,#9ca3af)",
              border: active ? "1px solid var(--gold,#d4a017)" : "1px solid rgba(255,255,255,0.1)",
            }}>
              {tab}
            </Link>
          );
        })}
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "5rem 2rem",
          color: "var(--muted,#9ca3af)", fontSize: "1rem",
          border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "1rem",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎭</div>
          <p style={{ margin: 0 }}>No events found. Check back soon!</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem",
        }}>
          {events.map((event: any) => (
            <EventCard key={event._id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
