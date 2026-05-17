import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { getEvents, getEventStats } from "@/lib/services/eventService";
import Link from "next/link";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  Upcoming: "#d4a017", Ongoing: "#22c55e", Completed: "#6b7280", Cancelled: "#ef4444",
};

export default async function AdminEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") redirect("/login");

  const [result, stats] = await Promise.all([
    getEvents({ limit: 50 }) as any,
    getEventStats(),
  ]);

  const events = result.events;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div className="section-label">Admin</div>
          <h1 className="section-title" style={{ fontSize: "1.75rem", margin: 0 }}>Events</h1>
        </div>
        <Link href="/admin/events/new" className="btn-primary">+ New Event</Link>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {Object.entries(stats).map(([s, count]) => (
          <div key={s} style={{
            padding: "0.75rem 1.25rem", borderRadius: "0.6rem",
            background: `${statusColors[s] || "#d4a017"}12`,
            border: `1px solid ${statusColors[s] || "#d4a017"}33`,
            fontSize: "0.82rem", color: "var(--text)",
          }}>
            <strong style={{ color: statusColors[s] || "#d4a017" }}>{s}</strong>: {count as number}
          </div>
        ))}
      </div>

      {/* Table */}
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--muted,#9ca3af)",
          border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "1rem" }}>
          No events yet. <Link href="/admin/events/new" style={{ color: "var(--gold,#d4a017)" }}>Create one →</Link>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Title", "Category", "Date", "Venue", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.6rem 0.85rem", textAlign: "left", fontSize: "0.72rem",
                    fontWeight: 700, color: "var(--muted,#9ca3af)", letterSpacing: "0.06em",
                    textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((ev: any) => (
                <tr key={ev._id}>
                  <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontWeight: 600, color: "var(--text)" }}>
                    {ev.featured && <span title="Featured" style={{ color: "var(--gold,#d4a017)", marginRight: "0.3rem" }}>✦</span>}
                    {ev.title}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem", color: "var(--muted,#9ca3af)" }}>
                    {ev.category}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem", color: "var(--muted,#9ca3af)", whiteSpace: "nowrap" }}>
                    {new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem", color: "var(--muted,#9ca3af)" }}>
                    {ev.venue?.city || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{
                      padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem", fontWeight: 600,
                      color: statusColors[ev.status] || "#d4a017",
                      background: `${statusColors[ev.status] || "#d4a017"}18`,
                    }}>{ev.status}</span>
                  </td>
                  <td style={{ padding: "0.75rem 0.85rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <Link href={`/admin/events/${ev._id}`} style={{ fontSize: "0.78rem", color: "var(--gold,#d4a017)", textDecoration: "none" }}>Manage</Link>
                      <Link href={`/events/${ev.slug}`} target="_blank" style={{ fontSize: "0.78rem", color: "var(--muted,#9ca3af)", textDecoration: "none" }}>View ↗</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
