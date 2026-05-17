"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventFormProps = {
  initial?: any;
  mode: "create" | "edit";
  eventId?: string;
};

export default function EventForm({ initial, mode, eventId }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    category: initial?.category || "Concert",
    shortDescription: initial?.shortDescription || "",
    description: initial?.description || "",
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 16) : "",
    endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 16) : "",
    coverImage: initial?.coverImage || "",
    status: initial?.status || "Upcoming",
    featured: initial?.featured || false,
    capacity: initial?.capacity ?? 0,
    registrationOpen: initial?.registrationOpen ?? true,
    tags: initial?.tags?.join(", ") || "",
    venueName: initial?.venue?.name || "",
    venueCity: initial?.venue?.city || "",
    venueState: initial?.venue?.state || "",
    venueAddress: initial?.venue?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        category: form.category,
        shortDescription: form.shortDescription,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        coverImage: form.coverImage || undefined,
        status: form.status,
        featured: form.featured,
        capacity: Number(form.capacity),
        registrationOpen: form.registrationOpen,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        venue: {
          name: form.venueName,
          city: form.venueCity,
          state: form.venueState,
          address: form.venueAddress,
        },
      };
      const url = mode === "edit" ? `/api/admin/events/${eventId}` : "/api/admin/events";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      router.push("/admin/events");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.6rem 0.85rem", borderRadius: "0.5rem",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
  };
  const label: React.CSSProperties = {
    display: "block", fontSize: "0.78rem", fontWeight: 600,
    color: "var(--muted,#9ca3af)", marginBottom: "0.3rem", letterSpacing: "0.04em",
  };
  const row: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {error && <p style={{ color: "#f87171", fontSize: "0.85rem", margin: 0, padding: "0.5rem 0.75rem", background: "rgba(248,113,113,0.08)", borderRadius: "0.4rem" }}>{error}</p>}

      <div><label style={label}>Title *</label><input style={inputStyle} required value={form.title} onChange={e => set("title", e.target.value)} placeholder="Event title" /></div>

      <div style={row}>
        <div>
          <label style={label}>Category *</label>
          <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            {["Concert", "Corporate", "Festival", "Wedding Show", "Comedy Night", "Live Performance", "Other"].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={label}>Status</label>
          <select style={inputStyle} value={form.status} onChange={e => set("status", e.target.value)}>
            {["Upcoming", "Ongoing", "Completed", "Cancelled"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div><label style={label}>Short Description</label><input style={inputStyle} value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} placeholder="One-liner for card preview" /></div>
      <div><label style={label}>Full Description</label><textarea style={{ ...inputStyle, minHeight: 120, resize: "vertical" }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Full event details…" /></div>

      <div style={row}>
        <div><label style={label}>Start Date & Time *</label><input style={inputStyle} required type="datetime-local" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
        <div><label style={label}>End Date & Time</label><input style={inputStyle} type="datetime-local" value={form.endDate} onChange={e => set("endDate", e.target.value)} /></div>
      </div>

      <div><label style={label}>Cover Image URL (ImageKit)</label><input style={inputStyle} value={form.coverImage} onChange={e => set("coverImage", e.target.value)} placeholder="https://ik.imagekit.io/…" /></div>

      <fieldset style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: "0.75rem", padding: "1rem" }}>
        <legend style={{ ...label, padding: "0 0.5rem" }}>Venue</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={row}>
            <div><label style={label}>Venue Name</label><input style={inputStyle} value={form.venueName} onChange={e => set("venueName", e.target.value)} placeholder="Hall / Stadium name" /></div>
            <div><label style={label}>City</label><input style={inputStyle} value={form.venueCity} onChange={e => set("venueCity", e.target.value)} /></div>
          </div>
          <div style={row}>
            <div><label style={label}>State</label><input style={inputStyle} value={form.venueState} onChange={e => set("venueState", e.target.value)} /></div>
            <div><label style={label}>Address</label><input style={inputStyle} value={form.venueAddress} onChange={e => set("venueAddress", e.target.value)} /></div>
          </div>
        </div>
      </fieldset>

      <div style={row}>
        <div><label style={label}>Capacity (0 = unlimited)</label><input style={inputStyle} type="number" min={0} value={form.capacity} onChange={e => set("capacity", e.target.value)} /></div>
        <div><label style={label}>Tags (comma-separated)</label><input style={inputStyle} value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="music, outdoor, family" /></div>
      </div>

      <div style={{ display: "flex", gap: "1.5rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text)", cursor: "pointer" }}>
          <input type="checkbox" checked={form.featured} onChange={e => set("featured", e.target.checked)} />
          Featured on home page
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--text)", cursor: "pointer" }}>
          <input type="checkbox" checked={form.registrationOpen} onChange={e => set("registrationOpen", e.target.checked)} />
          Registration open
        </label>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
        <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.7 : 1 }}>
          {saving ? "Saving…" : mode === "edit" ? "Save Changes ✦" : "Create Event ✦"}
        </button>
        <button type="button" className="btn-outline" onClick={() => router.back()}>Cancel</button>
      </div>
    </form>
  );
}
