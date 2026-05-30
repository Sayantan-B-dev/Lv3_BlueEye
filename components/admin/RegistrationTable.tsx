"use client";

import { useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

const STATUS_OPTIONS = ["Pending", "Approved", "Rejected", "Waitlisted"] as const;
type RegStatus = typeof STATUS_OPTIONS[number];

const statusColors: Record<RegStatus, string> = {
  Pending: "#d4a017",
  Approved: "#22c55e",
  Rejected: "#f87171",
  Waitlisted: "#a78bfa",
};

export default function RegistrationTable({ initialRegistrations, eventId }: {
  initialRegistrations: any[];
  eventId: string;
}) {
  const [regs, setRegs] = useState<any[]>(initialRegistrations);
  const [loadingId, setLoadingId] = useState<string | null>(null);
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
      setModal({
        isOpen: true,
        title: "Update Failed",
        message: err.message || "Failed to update registration status.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    } finally {
      setLoadingId(null);
    }
  }

  if (regs.length === 0) {
    return (
      <div style={{
        textAlign: "center",
        padding: "3.5rem 2rem",
        color: "var(--text3)",
        border: "1px dashed rgba(255,255,255,0.1)",
        borderRadius: "1rem"
      }}>
        No guest registrations received for this event yet.
      </div>
    );
  }

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = regs.filter(r => r.status === s).length;
    return acc;
  }, {} as Record<RegStatus, number>);

  return (
    <div className="fade-in">
      {/* Summary pills */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        {STATUS_OPTIONS.map(s => (
          <span key={s} className="admin-badge" style={{
            color: statusColors[s],
            background: `${statusColors[s]}10`,
            border: `1px solid ${statusColors[s]}22`,
            fontSize: "0.78rem",
            padding: "6px 14px",
            borderRadius: "8px",
          }}>
            {s}: <strong style={{ color: "#ffffff", marginLeft: 4 }}>{counts[s]}</strong>
          </span>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              {/* Disable the 48px width lock on the first column */}
              <th style={{ width: "auto", minWidth: "160px", maxWidth: "none", whiteSpace: "nowrap" }}>Name</th>
              <th style={{ whiteSpace: "nowrap" }}>Email Address</th>
              <th style={{ whiteSpace: "nowrap" }}>Phone</th>
              <th className="text-center" style={{ whiteSpace: "nowrap" }}>Guests</th>
              <th style={{ whiteSpace: "nowrap" }}>Request Message</th>
              <th style={{ whiteSpace: "nowrap" }}>Submitted</th>
              <th className="text-right" style={{ whiteSpace: "nowrap" }}>Status Action</th>
            </tr>
          </thead>
          <tbody>
            {regs.map(r => (
              <tr key={r._id}>
                {/* Disable the 48px width lock on the first column */}
                <td style={{ width: "auto", minWidth: "160px", maxWidth: "none", fontWeight: "bold" }} className="text-text">
                  {r.guestName}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <a href={`mailto:${r.guestEmail}`} style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }} className="hover:underline">
                    {r.guestEmail}
                  </a>
                </td>
                <td style={{ whiteSpace: "nowrap" }} className="text-text2">
                  {r.guestPhone}
                </td>
                <td className="text-center font-bold text-text">
                  {r.headcount}
                </td>
                <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="text-text3" title={r.message}>
                  {r.message || "—"}
                </td>
                <td style={{ whiteSpace: "nowrap", fontSize: "0.8-rem" }} className="text-text3">
                  {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td className="text-right">
                  <select
                    value={r.status}
                    disabled={loadingId === r._id}
                    onChange={e => updateStatus(r._id, e.target.value as RegStatus)}
                    style={{
                      padding: "6px 16px 6px 10px",
                      borderRadius: "8px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: `${statusColors[r.status as RegStatus]}15`,
                      border: `1px solid ${statusColors[r.status as RegStatus]}35`,
                      color: statusColors[r.status as RegStatus],
                      outline: "none",
                      colorScheme: "dark",
                    }}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background: "#11141a", color: "#ffffff" }}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
