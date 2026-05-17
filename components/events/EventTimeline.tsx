import EventTimelinePost from "./EventTimelinePost";

export default function EventTimeline({ updates }: { updates: any[] }) {
  if (!updates || updates.length === 0) {
    return (
      <div style={{
        textAlign: "center", padding: "3rem 1rem",
        color: "var(--muted,#6b7280)", fontSize: "0.9rem",
        border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "0.75rem",
      }}>
        No updates yet — check back soon.
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Vertical line */}
      <div style={{
        position: "absolute", left: 17, top: 36, bottom: 0,
        width: 2, background: "rgba(255,255,255,0.07)", zIndex: 0,
      }} />
      {updates.map((u) => (
        <EventTimelinePost key={u._id} update={u} />
      ))}
    </div>
  );
}
