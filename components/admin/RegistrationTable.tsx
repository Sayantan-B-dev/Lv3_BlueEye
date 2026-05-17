"use client";

import { useState } from "react";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Waitlisted"] as const;
type RegStatus = typeof STATUS_OPTIONS[number];

const statusColors: Record<RegStatus, string> = {
  Pending: "#d4a017", Approved: "#22c55e", Rejected: "#f87171", Waitlisted: "#a78bfa",
};

export default function RegistrationTable({ initialRegistrations, eventId }: {
  initialRegistrations: any[];
  eventId: string;
}) {
  const [regs, setRegs] = useState<any[]>(initialRegistrations);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function updateStatus(rid: string, status: RegStatus) {
    setLoadingId(rid);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/registrations/${rid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setRegs(prev => prev.map(r => r._id === rid ? { ...r, status } : r));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoadingId(null);
    }
  }

  if (regs.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted,#9ca3af)", fontSize: "0.875rem",
        border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "0.75rem" }}>
        No registrations yet.
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    padding: "0.6rem 0.85rem", textAlign: "left", fontSize: "0.72rem",
    fontWeight: 700, color: "var(--muted,#9ca3af)", letterSpacing: "0.06em",
    textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.07)",
  };
  const tdStyle: React.CSSProperties = {
    padding: "0.65rem 0.85rem", fontSize: "0.82rem", color: "var(--text)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  };

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = regs.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<RegStatus, number>);

  return (
    <div>
      {/* Summary pills */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        {STATUS_OPTIONS.map(s => (
          <span key={s} style={{
            padding: "4px 12px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600,
            color: statusColors[s], background: `${statusColors[s]}18`,
            border: `1px solid ${statusColors[s]}33`,
          }}>
            {s}: {counts[s]}
          </span>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Phone</th>
              <th style={thStyle}>Guests</th>
              <th style={thStyle}>Message</th>
              <th style={thStyle}>Submitted</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {regs.map(r => (
              <tr key={r._id}>
                <td style={tdStyle}>{r.guestName}</td>
                <td style={tdStyle}><a href={`mailto:${r.guestEmail}`} style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>{r.guestEmail}</a></td>
                <td style={tdStyle}>{r.guestPhone}</td>
                <td style={{ ...tdStyle, textAlign: "center" }}>{r.headcount}</td>
                <td style={{ ...tdStyle, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title={r.message}>{r.message || "—"}</td>
                <td style={{ ...tdStyle, whiteSpace: "nowrap", color: "var(--muted,#9ca3af)", fontSize: "0.75rem" }}>
                  {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td style={tdStyle}>
                  <select
                    value={r.status}
                    disabled={loadingId === r._id}
                    onChange={e => updateStatus(r._id, e.target.value as RegStatus)}
                    style={{
                      padding: "4px 8px", borderRadius: "0.4rem", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                      background: `${statusColors[r.status as RegStatus]}18`,
                      border: `1px solid ${statusColors[r.status as RegStatus]}44`,
                      color: statusColors[r.status as RegStatus],
                      outline: "none",
                    }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
