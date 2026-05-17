const typeConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  Info:      { icon: "ℹ", color: "#60a5fa", bg: "rgba(96,165,250,0.1)",  label: "Info" },
  Alert:     { icon: "⚠", color: "#f87171", bg: "rgba(248,113,113,0.1)", label: "Alert" },
  Milestone: { icon: "✦", color: "#d4a017", bg: "rgba(212,160,23,0.1)",  label: "Milestone" },
  Media:     { icon: "🖼", color: "#a78bfa", bg: "rgba(167,139,250,0.1)", label: "Media" },
};

export default function EventTimelinePost({ update }: { update: any }) {
  const cfg = typeConfig[update.type] ?? typeConfig["Info"];
  const date = new Date(update.createdAt).toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div style={{ display: "flex", gap: "1rem", position: "relative" }}>
      {/* Icon dot */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          background: cfg.bg, border: `2px solid ${cfg.color}55`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1rem", zIndex: 1,
        }}>
          {cfg.icon}
        </div>
        {/* Connector line — rendered by parent */}
      </div>

      {/* Content */}
      <div style={{
        flex: 1, background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "0.75rem", padding: "1rem 1.25rem",
        marginBottom: "1.25rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
            padding: "2px 8px", borderRadius: "999px",
            color: cfg.color, background: cfg.bg,
          }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: "0.75rem", color: "var(--muted,#6b7280)" }}>{date}</span>
          {update.postedBy && (
            <span style={{ fontSize: "0.75rem", color: "var(--muted,#6b7280)", marginLeft: "auto" }}>
              by {update.postedBy}
            </span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.65, color: "var(--text)" }}>
          {update.content}
        </p>
        {update.attachments?.length > 0 && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            {update.attachments.map((url: string, i: number) => (
              <img key={i} src={url} alt="attachment"
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.08)" }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
