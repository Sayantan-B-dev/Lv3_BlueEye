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
  const [backingUp, setBackingUp] = useState(false);
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
    setBackingUp(true);
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "inquiries" }),
      });
      const data = await res.json();
      if (data.success) {
        setModal({
          isOpen: true,
          title: "Backup Successful",
          message: "The inquiries database backup has been completed successfully.",
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
        message: "An unexpected error occurred during backup. Please check your network and try again.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    } finally {
      setBackingUp(false);
    }
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
        <div className="flex gap-4">
          <button 
            onClick={handleBackup} 
            disabled={backingUp} 
            className="btn-outline flex items-center gap-2 border-gold/40 text-gold hover:bg-gold/10 disabled:opacity-50"
          >
            {backingUp ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                Backing up...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Back Up RN
              </>
            )}
          </button>

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
