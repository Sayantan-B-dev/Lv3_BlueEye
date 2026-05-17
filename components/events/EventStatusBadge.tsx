type Status = "Upcoming" | "Ongoing" | "Completed" | "Cancelled";

const config: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  Upcoming:  { label: "Upcoming",  color: "#d4a017", bg: "rgba(212,160,23,0.12)",  dot: "#d4a017" },
  Ongoing:   { label: "Live Now",  color: "#22c55e", bg: "rgba(34,197,94,0.12)",   dot: "#22c55e" },
  Completed: { label: "Completed", color: "#6b7280", bg: "rgba(107,114,128,0.12)", dot: "#6b7280" },
  Cancelled: { label: "Cancelled", color: "#ef4444", bg: "rgba(239,68,68,0.12)",   dot: "#ef4444" },
};

export default function EventStatusBadge({ status }: { status: string }) {
  const s = (config[status as Status] ?? config["Upcoming"]);
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: "3px 10px", borderRadius: "999px", fontSize: "0.75rem",
      fontWeight: 600, letterSpacing: "0.04em",
      color: s.color, background: s.bg,
      border: `1px solid ${s.color}33`,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: s.dot,
        ...(status === "Ongoing" ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
      }} />
      {s.label}
    </span>
  );
}
