"use client";

import { useEffect, useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

// Custom Checkbox Component
const Checkbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    className={`admin-checkbox ${checked ? 'checked' : ''}`}
  >
    {checked && (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )}
  </div>
);

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastBackedAt, setLastBackedAt] = useState<Date | null>(null);
  const [backupMinsAgo, setBackupMinsAgo] = useState<number | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [syncing, setSyncing] = useState(false);
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

  const handleBackup = async () => {
    setDropdownOpen(false);
    setBackingUp(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "inquiries" }),
      });
      const data = await res.json();
      if (data.success) {
        const now = new Date();
        setLastBackedAt(now);
        setBackupMinsAgo(0);
        setModal({
          isOpen: true,
          title: "Backup Successful",
          message: `Inquiries backup completed at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
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
      title: "Sync Up Inquiries",
      message: "This will replace all current live inquiries with the last backup snapshot. This action cannot be undone. Are you sure?",
      variant: "warning",
      showCancel: true,
      confirmText: "Yes, Sync Up",
      onConfirm: async () => {
        setSyncing(true);
        try {
          const res = await fetch("/api/admin/backup", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "inquiries" }),
          });
          const data = await res.json();
          if (data.success) {
            setModal({
              isOpen: true,
              title: "Sync Successful",
              message: `Live inquiries have been restored from backup (${data.count} records synced).`,
              variant: "success",
              showCancel: false,
              confirmText: "Close",
              onConfirm: () => fetchInquiries(),
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

  const fetchInquiries = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/inquiries?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setInquiries(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInquiries(search);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === inquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(inquiries.map(i => i._id));
    }
  };

  const handleBulkDelete = () => {
    setModal({
      isOpen: true,
      title: "Delete Inquiries",
      message: `Are you sure you want to delete ${selectedIds.length} inquiries? This data will be permanently removed.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/inquiries`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: selectedIds })
          });
          const data = await res.json();
          if (data.success) {
            setInquiries(prev => prev.filter(i => !selectedIds.includes(i._id)));
            setSelectedIds([]);
          }
        } catch (err) {
          console.error("Failed to delete inquiries");
        }
      }
    });
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setInquiries(prev => prev.map(i => i._id === id ? { ...i, status } : i));
      }
    } catch (err) {
      setModal({
        isOpen: true,
        title: "Update Failed",
        message: "Failed to update inquiry status. Please try again.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    }
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h1 className="admin-title">
            Booking <span className="text-gold">Inquiries</span>
          </h1>
          <p className="admin-subtitle">Manage lead requests from clients interested in artists.</p>
        </div>
        <div className="flex gap-4 items-center">
          {/* Data Control Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              disabled={backingUp || syncing}
              className="btn-outline flex items-center gap-2 disabled:opacity-50"
              style={{ borderColor: "var(--border)", color: "var(--gold)" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>
              Data Control
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: "transform 0.2s", transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {dropdownOpen && (
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", minWidth: 220, background: "var(--bg2)", border: "1px solid var(--border)", borderRadius: 12, padding: "8px", zIndex: 50, boxShadow: "var(--shadow)" }}>
                {/* Last backup timestamp */}
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

          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-outline border-crimson text-crimson bg-crimson/10 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      <div className="admin-table-container" style={{ marginTop: "1rem" }}>
        <form onSubmit={handleSearch} className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search by client name, email or artist..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          </div>
          <button type="submit" className="btn-outline px-8 rounded-xl">Search</button>
        </form>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>
                  <Checkbox checked={selectedIds.length === inquiries.length && inquiries.length > 0} onChange={toggleSelectAll} />
                </th>
                <th>Client Details</th>
                <th>Artist / Event</th>
                <th>Message</th>
                <th>Status</th>
                <th className="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16">Loading inquiries...</td></tr>
              ) : inquiries.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">No inquiries found.</td></tr>
              ) : inquiries.map((iq) => (
                <tr key={iq._id}>
                  <td style={{ width: '48px' }}>
                    <Checkbox checked={selectedIds.includes(iq._id)} onChange={() => toggleSelect(iq._id)} />
                  </td>
                  <td>
                    <div className="font-bold text-lg">{iq.clientName}</div>
                    <div className="text-xs text-text3">{iq.clientEmail}</div>
                    <div className="text-xs text-text3">{iq.clientPhone}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-gold">{iq.artistName}</div>
                    <div className="text-sm">
                      <span className="opacity-70"></span> {iq.eventDate ? new Date(iq.eventDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs opacity-60">{iq.eventType}</div>
                  </td>
                  <td className="max-w-[250px]">
                    <div className="text-sm text-text2 leading-relaxed">
                      {iq.message || "No message provided."}
                    </div>
                  </td>
                  <td>
                    <select 
                      value={iq.status} 
                      onChange={(e) => updateStatus(iq._id, e.target.value)}
                      className={`admin-badge cursor-pointer outline-none border border-white/5 ${iq.status === 'Contacted' ? 'status-healthy' : ''}`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="text-right">
                    <div className="text-sm text-text3">
                      {new Date(iq.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {new Date(iq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
    </div>
  );
}
