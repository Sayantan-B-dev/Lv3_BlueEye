"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Dashboard {
  capacity: number;
  sold: number;
  tiers: { code: string; name: string; pricePaise: number; totalQty: number; soldQty: number; remaining: number; status: string }[];
  orders: number;
  orderStatus: Record<string, number>;
  revenuePaise: number;
  checkedIn: number;
  activeTickets: number;
}

export default function TicketingDashboardPage() {
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ticketing/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStats(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = stats
    ? [
        { label: "Capacity", value: stats.capacity },
        { label: "Sold", value: stats.sold },
        { label: "Remaining", value: stats.capacity - stats.sold },
        { label: "Revenue", value: `₹${(stats.revenuePaise / 100).toLocaleString("en-IN")}` },
        { label: "Orders", value: stats.orders },
        { label: "Checked in", value: stats.checkedIn },
      ]
    : [];

  return (
    <div className="fade-in">
      <div className="flex justify-between items-end mb-10" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-title">Event <span className="text-gold">Ticketing</span></h1>
          <p className="admin-subtitle">Ticket sales, revenue and check-in status.</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/admin/ticketing/orders" className="btn-outline">Orders</Link>
          <Link href="/admin/ticketing/checkin" className="btn-outline">Check-in Scanner</Link>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text3)" }}>Loading stats…</p>
      ) : !stats ? (
        <p style={{ color: "var(--text3)" }}>No ticketing data yet. Enable ticketing on an event first.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {cards.map((c) => (
              <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--gold)" }}>{c.value}</div>
                <div className="admin-subtitle" style={{ margin: 0 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-table-container">
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: "1rem" }}>Inventory by category</h2>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr><th>Category</th><th>Price</th><th>Total</th><th>Sold</th><th>Remaining</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {stats.tiers.map((t) => (
                    <tr key={t.code}>
                      <td className="font-semibold text-gold">{t.name}</td>
                      <td>₹{(t.pricePaise / 100).toLocaleString("en-IN")}</td>
                      <td>{t.totalQty}</td>
                      <td>{t.soldQty}</td>
                      <td>{t.remaining}</td>
                      <td>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="admin-table-container" style={{ marginTop: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: "1rem" }}>Orders by status</h2>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {Object.entries(stats.orderStatus).map(([s, n]) => (
                <span key={s} className="admin-badge">{s}: {n}</span>
              ))}
              {Object.keys(stats.orderStatus).length === 0 && (
                <span style={{ color: "var(--text3)", fontSize: "0.85rem" }}>No orders yet.</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
