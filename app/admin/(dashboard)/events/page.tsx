"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BulkDeleteOtpModal from "@/components/ui/BulkDeleteOtpModal";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastBackedAt, setLastBackedAt] = useState<Date | null>(null);
  const [backupMinsAgo, setBackupMinsAgo] = useState<number | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info" | "success";
    showCancel?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "danger",
    showCancel: true,
    confirmText: "Confirm",
  });
  const [otpModal, setOtpModal] = useState(false);
  const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleBackup = async () => {
    setDropdownOpen(false);
    setBackingUp(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "events" }),
      });
      const data = await res.json();
      if (data.success) {
        const now = new Date();
        setLastBackedAt(now);
        setBackupMinsAgo(0);
        setModal({
          isOpen: true,
          title: "Backup Successful",
          message: `Events backup completed at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
          variant: "success",
          showCancel: false,
          confirmText: "Close",
          onConfirm: () => {},
        });
      } else {
        setModal({
          isOpen: true,
          title: "Backup Failed",
          message: "Backup failed: " + (data.error || "Unknown error"),
          variant: "danger",
          showCancel: false,
          confirmText: "Close",
          onConfirm: () => {},
        });
      }
    } catch (err) {
      console.error(err);
      setModal({
        isOpen: true,
        title: "Backup Failed",
        message: "An unexpected error occurred. Please try again.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    } finally {
      setBackingUp(false);
    }
  };

  // Update "X min ago" display every 30 seconds
  useEffect(() => {
    if (!lastBackedAt) return;
    const tick = () => {
      const mins = Math.floor((Date.now() - lastBackedAt.getTime()) / 60_000);
      setBackupMinsAgo(mins);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [lastBackedAt]);

  const handleSync = () => {
    setModal({
      isOpen: true,
      title: "Sync Up Events",
      message: "This will replace all current live events with the last backup snapshot. This action cannot be undone. Are you sure?",
      variant: "warning",
      showCancel: true,
      confirmText: "Yes, Sync Up",
      onConfirm: async () => {
        setSyncing(true);
        try {
          const res = await fetch("/api/admin/backup", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "events" }),
          });
          const data = await res.json();
          if (data.success) {
            setModal({
              isOpen: true,
              title: "Sync Successful",
              message: `Live events have been restored from backup (${data.count} records synced).`,
              variant: "success",
              showCancel: false,
              confirmText: "Close",
              onConfirm: () => {
                fetch("/api/admin/events?limit=50")
                  .then(r => r.json())
                  .then(d => { setEvents(d.events || []); setStats(d.stats || {}); });
              },
            });
          } else {
            setModal({
              isOpen: true,
              title: "Sync Failed",
              message: "Sync failed: " + (data.error || "Unknown error"),
              variant: "danger",
              showCancel: false,
              confirmText: "Close",
              onConfirm: () => {},
            });
          }
        } catch (err) {
          console.error(err);
          setModal({
            isOpen: true,
            title: "Sync Failed",
            message: "An unexpected error occurred during sync. Please try again.",
            variant: "danger",
            showCancel: false,
            confirmText: "Close",
            onConfirm: () => {},
          });
        } finally {
          setSyncing(false);
        }
      },
    });
  };

  useEffect(() => {
    fetch("/api/admin/events?limit=50")
      .then(r => r.json())
      .then(d => {
        setEvents(d.events || []);
        setStats(d.stats || {});
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string, title: string) {
    // First confirmation
    setModal({
      isOpen: true,
      title: "Delete Event",
      message: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      variant: "danger",
      showCancel: true,
      confirmText: "Delete",
      onConfirm: () => {
        // Second confirmation
        setModal({
          isOpen: true,
          title: "⚠️ Final Confirmation",
          message: `This is your FINAL warning. "${title}" will be permanently removed. Proceed?`,
          variant: "danger",
          showCancel: true,
          confirmText: "Yes, Delete Permanently",
          onConfirm: async () => {
            await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
            setEvents(prev => prev.filter(e => e._id !== id));
          }
        });
      }
    });
  }

  const handleBulkDelete = () => {
    setPendingBulkDeleteIds([...selectedIds]);
    setOtpModal(true);
  };

  const executeBulkDelete = async () => {
    try {
      await Promise.all(
        pendingBulkDeleteIds.map(id => fetch(`/api/admin/events/${id}`, { method: "DELETE" }))
      );
      setEvents(prev => prev.filter(e => !pendingBulkDeleteIds.includes(e._id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("Failed to bulk delete events");
    } finally {
      setOtpModal(false);
      setPendingBulkDeleteIds([]);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex justify-between items-end gap-8 flex-wrap" style={{ marginBottom: "3rem" }}>
        <div>
          <h1 className="admin-title">
            Event <span className="text-gold">Management</span>
          </h1>
          <p className="admin-subtitle">
            Create and manage events, post timeline updates, and handle registrations.
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Data Control Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              disabled={backingUp || syncing}
              className="btn-outline flex items-center gap-2 disabled:opacity-50 py-3 px-6 rounded-xl text-sm font-bold"
              style={{ borderColor: "var(--border)", color: "var(--gold)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
              Data Control
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {dropdownOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 220, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px", zIndex: 50, boxShadow: "var(--shadow)" }}>
                {lastBackedAt && (
                  <div style={{ padding: "6px 10px 10px", fontSize: "0.7rem", color: "var(--text3)", borderBottom: "1px solid var(--border)", marginBottom: 6 }}>
                    Last backup: {backupMinsAgo === 0 ? "just now" : `${backupMinsAgo}m ago`} · {lastBackedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
                <button
                  onClick={handleBackup}
                  disabled={backingUp}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, background: "transparent", border: "none", color: "var(--text)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {backingUp
                    ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  }
                  {backingUp ? "Backing up..." : "Backup Now"}
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); handleSync(); }}
                  disabled={syncing}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 10px", borderRadius: 8, background: "transparent", border: "none", color: "var(--text)", cursor: "pointer", fontSize: "0.85rem", fontWeight: 500 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--bg3)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {syncing
                    ? <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                  }
                  Sync Up
                </button>
              </div>
            )}
          </div>
          <Link href="/admin/events/new" className="btn-primary py-3 px-6 rounded-xl text-sm font-bold no-underline">
            + Create Event
          </Link>
        </div>
      </div>

      {/* Elegant Dashboard Stats Widgets */}
      {Object.keys(stats).length > 0 && (
        <div className="admin-stats-grid mb-8">
          {Object.entries(stats).map(([status, count]) => (
            <div key={status} className="admin-card">
              <div className="admin-card-label uppercase tracking-widest text-[10px] font-black">{status} Events</div>
              <div className="admin-card-value text-gold">{count as number}</div>
            </div>
          ))}
        </div>
      )}

      {/* Events Directory Table */}
      <div className="admin-table-container">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                {/* Override default first-child 48px restriction to prevent event title collision */}
                <th style={{ width: "auto", minWidth: "280px", maxWidth: "none" }}>Event</th>
                <th style={{ whiteSpace: "nowrap" }}>Category</th>
                <th style={{ whiteSpace: "nowrap" }}>Date</th>
                <th style={{ whiteSpace: "nowrap" }}>Venue</th>
                <th style={{ whiteSpace: "nowrap" }}>Status</th>
                <th className="text-center" style={{ whiteSpace: "nowrap" }}>Capacity</th>
                <th className="text-right" style={{ whiteSpace: "nowrap" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16 text-text3">Loading events…</td></tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-text3">
                    No events yet.{" "}
                    <Link href="/admin/events/new" className="text-gold underline">Create one →</Link>
                  </td>
                </tr>
              ) : events.map((ev) => (
                <tr key={ev._id}>
                  {/* Override default first-child 48px restriction to prevent event title collision */}
                  <td style={{ width: "auto", minWidth: "280px", maxWidth: "none" }}>
                    <div className="flex items-center gap-4">
                      {ev.coverImage ? (
                        <img src={ev.coverImage} alt={ev.title ? `${ev.title} cover image` : "Event cover image"} style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                      ) : (
                        <div style={{ width: 50, height: 50, borderRadius: 10, background: "rgba(212,160,23,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div className="font-bold text-text truncate" style={{ fontSize: "0.95rem" }}>
                          {ev.featured && <span className="text-gold mr-1" title="Featured Event">✦</span>}
                          {ev.title}
                        </div>
                        <div className="text-xs text-text3 mt-0.5">{ev.registrationOpen ? "Guest Registration Open" : "Registration Closed"}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge">{ev.category}</span>
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }} className="text-text2">
                    {new Date(ev.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem" }} className="text-text2">
                    {ev.venue?.city || "TBA"}
                  </td>
                  <td>
                    <span className={`admin-badge ${ev.status === "Ongoing" ? "bg-emerald/10 text-emerald border-emerald/20" : ev.status === "Cancelled" ? "bg-crimson/10 text-crimson border-crimson/20" : ev.status === "Completed" ? "opacity-50" : ""}`}>
                      {ev.status === "Ongoing" && (
                        <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#22c55e", marginRight: 6, animation: "pulse 1.5s infinite" }} />
                      )}
                      {ev.status}
                    </span>
                  </td>
                  <td className="text-center font-bold text-text2" style={{ fontSize: "0.85rem" }}>
                    {ev.capacity > 0 ? `${ev.capacity} spots` : "Unlimited"}
                  </td>
                  <td>
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/events/${ev._id}`} className="admin-action-btn" title="Manage Event Workspace">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Link>
                      <Link href={`/events/${ev.slug}`} target="_blank" className="admin-action-btn" title="View Public Page">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </Link>
                      <button onClick={() => handleDelete(ev._id, ev.title)} className="admin-action-btn delete" title="Delete Event">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
        variant={modal.variant}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
      />
      <BulkDeleteOtpModal
        isOpen={otpModal}
        count={pendingBulkDeleteIds.length}
        resource="events"
        onVerified={executeBulkDelete}
        onCancel={() => { setOtpModal(false); setPendingBulkDeleteIds([]); }}
      />
    </div>
  );
}
