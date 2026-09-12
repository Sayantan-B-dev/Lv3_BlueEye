"use client";

import { useEffect, useState } from "react";

interface Row {
  _id: string;
  name?: string;
  username?: string;
  email: string;
  role: string;
  isBanned?: boolean;
  isVerified?: boolean;
  createdAt: string;
}

type Filter = "" | "user" | "staff" | "admin";

export default function UsersManager() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("");
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(
        `/api/admin/users?q=${encodeURIComponent(q)}&role=${filter}`
      );
      const d = await res.json();
      if (d.success) {
        setRows(d.data.users);
        setCounts(d.data.counts);
      } else {
        setMsg(d.message || "Failed to load users");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function setBanned(userId: string, email: string, banned: boolean) {
    if (!confirm(`${banned ? "BAN" : "UNBAN"} ${email}?${banned ? " They will not be able to log in." : ""}`)) return;
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, banned }),
      });
      const d = await res.json();
      if (d.success) {
        setRows((prev) => prev.map((r) => (r._id === userId ? { ...r, isBanned: banned } : r)));
        setMsg(d.message || "Updated");
      } else {
        setMsg(d.message || "Update failed");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusyId(null);
    }
  }

  async function setRole(userId: string, email: string, role: "user" | "staff") {
    const verb = role === "staff" ? "promote to STAFF" : "demote to user";
    if (!confirm(`${verb}: ${email}? They must log in again for it to take effect.`)) return;
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      });
      const d = await res.json();
      if (d.success) {
        setRows((prev) => prev.map((r) => (r._id === userId ? { ...r, role } : r)));
        setMsg(d.message || "Role updated. Takes effect on their next login.");
      } else {
        setMsg(d.message || "Update failed");
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusyId(null);
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "", label: `All` },
    { key: "user", label: `Users (${counts.user ?? "–"})` },
    { key: "staff", label: `Staff (${counts.staff ?? "–"})` },
    { key: "admin", label: `Admins (${counts.admin ?? "–"})` },
  ];

  return (
    <div className="fade-in">
      <div className="mb-10">
        <h1 className="admin-title">User <span className="text-gold">Roles</span></h1>
        <p className="admin-subtitle">
          Promote users to event staff or demote them. Admin accounts are locked here —
          only the database owner can grant admin. Role changes take effect on next login.
        </p>
      </div>

      {msg && (
        <div style={{ marginBottom: "1.5rem", padding: "0.9rem 1.2rem", borderRadius: 12, fontSize: "0.85rem", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", color: "var(--text)" }}>
          {msg}
        </div>
      )}

      <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={filter === t.key ? "btn-primary" : "btn-outline"}
            style={{ fontSize: "0.82rem", padding: "0.5rem 1rem" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-table-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex gap-4 mb-6"
        >
          <input
            type="text"
            placeholder="Search name, email or username…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="filter-input flex-1"
          />
          <button type="submit" className="btn-outline px-8 rounded-xl">Search</button>
        </form>

        {loading ? (
          <p style={{ color: "var(--text3)" }}>Loading users…</p>
        ) : rows.length === 0 ? (
          <p style={{ color: "var(--text3)" }}>No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table admin-table--flow">
              <thead>
                <tr><th>User</th><th>Role</th><th>Joined</th><th className="text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} style={r.isBanned ? { opacity: 0.65 } : undefined}>
                    <td>
                      <div className="font-bold">{r.name || r.username || "—"}</div>
                      <div className="text-xs text-text3">{r.email}</div>
                      {r.isBanned && (
                        <span className="admin-badge" style={{ background: "rgba(255,107,107,0.12)", color: "#ff6b6b", fontSize: "0.7rem", marginTop: "0.3rem", display: "inline-block" }}>
                          BANNED
                        </span>
                      )}
                    </td>
                    <td><span className="admin-badge">{r.role}</span></td>
                    <td className="text-sm text-text3" style={{ whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                    <td className="text-right">
                      {r.role === "admin" ? (
                        <span style={{ fontSize: "0.75rem", color: "var(--text3)" }}>Locked</span>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", flexWrap: "wrap" }}>
                          {r.role === "staff" ? (
                            <button
                              onClick={() => setRole(r._id, r.email, "user")}
                              disabled={busyId === r._id}
                              className="btn-outline"
                              style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                            >
                              Demote
                            </button>
                          ) : (
                            <button
                              onClick={() => setRole(r._id, r.email, "staff")}
                              disabled={busyId === r._id}
                              className="btn-primary"
                              style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                            >
                              Make staff
                            </button>
                          )}
                          {r.isBanned ? (
                            <button
                              onClick={() => setBanned(r._id, r.email, false)}
                              disabled={busyId === r._id}
                              className="btn-outline"
                              style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => setBanned(r._id, r.email, true)}
                              disabled={busyId === r._id}
                              className="btn-outline"
                              style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap", borderColor: "rgba(255,107,107,0.4)", color: "#ff6b6b" }}
                            >
                              Ban
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
