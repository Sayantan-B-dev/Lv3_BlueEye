"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EventForm from "@/components/admin/EventForm";
import EventUpdateForm from "@/components/admin/EventUpdateForm";
import EventTimeline from "@/components/events/EventTimeline";
import RegistrationTable from "@/components/admin/RegistrationTable";
import Link from "next/link";

type Tab = "details" | "thread" | "registrations";

export default function AdminEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("details");
  const [event, setEvent] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [evRes, updRes, regRes] = await Promise.all([
        fetch(`/api/admin/events/${id}`),
        fetch(`/api/admin/events/${id}/updates`),
        fetch(`/api/admin/events/${id}/registrations`),
      ]);
      if (evRes.ok) setEvent(await evRes.json());
      if (updRes.ok) setUpdates(await updRes.json());
      if (regRes.ok) setRegistrations(await regRes.json());
      setLoading(false);
    }
    load();
  }, [id]);

  async function deleteUpdate(uid: string) {
    if (!confirm("Delete this update?")) return;
    await fetch(`/api/admin/events/${id}/updates/${uid}`, { method: "DELETE" });
    setUpdates(prev => prev.filter(u => u._id !== uid));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "details",       label: "Details" },
    { key: "thread",        label: `Thread (${updates.length})` },
    { key: "registrations", label: `Registrations (${registrations.length})` },
  ];

  const tabBtn = (key: Tab, label: string) => (
    <button key={key} onClick={() => setTab(key)}
      style={{
        padding: "8px 18px", border: "none", cursor: "pointer",
        borderBottom: tab === key ? "2px solid var(--gold,#d4a017)" : "2px solid transparent",
        background: "transparent", fontWeight: tab === key ? 700 : 400,
        color: tab === key ? "var(--gold,#d4a017)" : "var(--muted,#9ca3af)",
        fontSize: "0.875rem", transition: "all 0.15s",
      }}>
      {label}
    </button>
  );

  if (loading) return <div style={{ padding: "3rem", color: "var(--muted,#9ca3af)" }}>Loading…</div>;
  if (!event) return <div style={{ padding: "3rem", color: "#f87171" }}>Event not found.</div>;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.78rem", color: "var(--muted,#9ca3af)", marginBottom: "0.25rem" }}>
            <Link href="/admin/events" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>Events</Link> /
          </div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--text)" }}>{event.title}</h1>
        </div>
        <Link href={`/events/${event.slug}`} target="_blank"
          className="btn-outline" style={{ fontSize: "0.82rem" }}>
          View Public Page ↗
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: "2rem" }}>
        {tabs.map(t => tabBtn(t.key, t.label))}
      </div>

      {/* Details tab */}
      {tab === "details" && (
        <div style={{ maxWidth: 700 }}>
          <EventForm mode="edit" eventId={id} initial={event} />
        </div>
      )}

      {/* Thread tab */}
      {tab === "thread" && (
        <div>
          <EventUpdateForm eventId={id} onPosted={u => setUpdates(prev => [u, ...prev])} />
          <div style={{ position: "relative" }}>
            {updates.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted,#9ca3af)",
                border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "0.75rem" }}>
                No updates yet. Post the first one above.
              </div>
            ) : (
              updates.map((u, i) => (
                <div key={u._id} style={{ position: "relative" }}>
                  {/* connector line */}
                  {i < updates.length - 1 && (
                    <div style={{ position: "absolute", left: 17, top: 36, bottom: 0,
                      width: 2, background: "rgba(255,255,255,0.07)" }} />
                  )}
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1.25rem", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      {/* Reuse the public timeline post style */}
                      <div style={{ padding: "1rem 1.25rem", background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px",
                            background: "rgba(212,160,23,0.1)", color: "var(--gold,#d4a017)" }}>{u.type}</span>
                          <span style={{ fontSize: "0.75rem", color: "var(--muted,#9ca3af)" }}>
                            {new Date(u.createdAt).toLocaleString("en-IN")}
                          </span>
                          <button onClick={() => deleteUpdate(u._id)}
                            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer",
                              color: "#f87171", fontSize: "0.75rem", padding: "0 4px" }}>
                            Delete
                          </button>
                        </div>
                        <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.6, color: "var(--text)" }}>{u.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Registrations tab */}
      {tab === "registrations" && (
        <RegistrationTable initialRegistrations={registrations} eventId={id} />
      )}
    </div>
  );
}
