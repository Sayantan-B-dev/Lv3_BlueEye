"use client";

import { useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function EventRegistrationForm({ slug, closed }: { slug: string; closed?: boolean }) {
  const [form, setForm] = useState({ guestName: "", guestEmail: "", guestPhone: "", headcount: 1, message: "" });
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  if (closed) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--muted,#9ca3af)", fontSize: "0.875rem",
        border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "0.75rem" }}>
        Registration is currently closed for this event.
      </div>
    );
  }

  if (state === "success") {
    return (
      <div style={{ textAlign: "center", padding: "2rem 1rem", borderRadius: "0.75rem",
        background: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)" }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
        <h3 style={{ margin: "0 0 0.5rem", color: "#22c55e", fontSize: "1.05rem" }}>Request Submitted!</h3>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted,#9ca3af)", lineHeight: 1.6 }}>
          Your registration is pending review. You'll be notified by email and WhatsApp once confirmed.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/events/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Submission failed");
      setState("success");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err.message);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.65rem 0.85rem", borderRadius: "0.5rem",
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--text)", fontSize: "0.875rem", outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "0.78rem", fontWeight: 600,
    color: "var(--muted,#9ca3af)", marginBottom: "0.35rem", letterSpacing: "0.04em",
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <label style={labelStyle}>Full Name *</label>
        <input style={inputStyle} required placeholder="Your name"
          value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Email *</label>
        <input style={inputStyle} required type="email" placeholder="you@example.com"
          value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Phone (WhatsApp) *</label>
        <input style={inputStyle} required placeholder="+91 98765 43210"
          value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))} />
      </div>
      <div>
        <label style={labelStyle}>Number of Guests</label>
        <input style={inputStyle} type="number" min={1} max={20}
          value={form.headcount} onChange={e => setForm(f => ({ ...f, headcount: parseInt(e.target.value) || 1 }))} />
      </div>
      <div>
        <label style={labelStyle}>Message (optional)</label>
        <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="Any special requirements?"
          value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
      </div>

      {state === "error" && (
        <p style={{ margin: 0, fontSize: "0.82rem", color: "#f87171",
          padding: "0.5rem 0.75rem", background: "rgba(248,113,113,0.08)", borderRadius: "0.4rem" }}>
          {errorMsg}
        </p>
      )}

      <button type="submit" disabled={state === "loading"}
        className="btn-primary" style={{ opacity: state === "loading" ? 0.7 : 1, cursor: state === "loading" ? "wait" : "pointer" }}>
        {state === "loading" ? "Submitting…" : "Request Registration ✦"}
      </button>
      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted,#6b7280)", textAlign: "center" }}>
        You'll receive a confirmation by email and WhatsApp.
      </p>
    </form>
  );
}
