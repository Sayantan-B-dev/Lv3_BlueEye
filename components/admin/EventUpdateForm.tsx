"use client";

import { useState } from "react";

type Props = { eventId: string; onPosted: (update: any) => void };

const TYPES = ["Info", "Alert", "Milestone", "Media"] as const;

export default function EventUpdateForm({ eventId, onPosted }: Props) {
  const [content, setContent] = useState("");
  const [type, setType] = useState<typeof TYPES[number]>("Info");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/events/${eventId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onPosted(json.update);
      setContent("");
      setType("Info");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const typeColors: Record<string, string> = {
    Info: "#60a5fa", Alert: "#f87171", Milestone: "#d4a017", Media: "#a78bfa",
  };

  return (
    <form onSubmit={handleSubmit} style={{
      display: "flex", flexDirection: "column", gap: "0.75rem",
      padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.75rem",
      border: "1px solid rgba(255,255,255,0.08)", marginBottom: "1.5rem",
    }}>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {TYPES.map(t => (
          <button key={t} type="button" onClick={() => setType(t)}
            style={{
              padding: "4px 12px", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
              border: `1px solid ${typeColors[t]}55`,
              background: type === t ? `${typeColors[t]}22` : "transparent",
              color: type === t ? typeColors[t] : "var(--muted,#9ca3af)",
              transition: "all 0.15s",
            }}>
            {t}
          </button>
        ))}
      </div>
      <textarea
        required value={content} onChange={e => setContent(e.target.value)}
        placeholder="Post a timeline update…"
        style={{
          width: "100%", minHeight: 80, padding: "0.65rem 0.85rem",
          background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "0.5rem", color: "var(--text)", fontSize: "0.875rem",
          resize: "vertical", outline: "none", boxSizing: "border-box",
        }} />
      {error && <p style={{ margin: 0, fontSize: "0.8rem", color: "#f87171" }}>{error}</p>}
      <button type="submit" disabled={saving || !content.trim()} className="btn-primary"
        style={{ alignSelf: "flex-end", opacity: saving ? 0.7 : 1 }}>
        {saving ? "Posting…" : "Post Update ✦"}
      </button>
    </form>
  );
}
