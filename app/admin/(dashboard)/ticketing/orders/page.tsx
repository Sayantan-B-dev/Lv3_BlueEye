"use client";

import { useState } from "react";

interface Order {
  _id: string;
  orderCode: string;
  buyer: { name: string; email: string; phone: string; city?: string };
  items: { tierName: string; unitPaise: number; qty: number }[];
  totalPaise: number;
  status: string;
  gatewayPaymentId?: string;
  createdAt: string;
}

export default function TicketingOrdersPage() {
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [msg, setMsg] = useState("");
  const [comp, setComp] = useState({ slug: "", tierCode: "", qty: "1", name: "", email: "", phone: "" });

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/ticketing/orders?q=${encodeURIComponent(q)}`);
      const d = await res.json();
      if (d.success) setOrders(d.data);
      else setMsg(d.message || "Search failed");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  async function refund(orderId: string, orderCode: string) {
    if (!confirm(`Mark order ${orderCode} as REFUNDED? Its tickets stop working. (Gateway refund is manual.)`)) return;
    const res = await fetch("/api/admin/ticketing/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const d = await res.json();
    if (d.success) {
      setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: "REFUNDED" } : o)));
      setMsg(`Order ${orderCode} refunded.`);
    } else {
      setMsg(d.message || "Refund failed");
    }
  }

  async function createComp(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/ticketing/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: comp.slug.trim(),
        tierCode: comp.tierCode.trim(),
        qty: Number(comp.qty) || 1,
        buyer: { name: comp.name, email: comp.email, phone: comp.phone },
      }),
    });
    const d = await res.json();
    if (d.success) {
      setMsg(`Complimentary tickets created: ${d.data.orderCode}`);
      setComp({ slug: "", tierCode: "", qty: "1", name: "", email: "", phone: "" });
    } else {
      setMsg(d.message || "Failed to create tickets");
    }
  }

  return (
    <div className="fade-in">
      <div className="flex justify-between items-end mb-10" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-title">Ticket <span className="text-gold">Orders</span></h1>
          <p className="admin-subtitle">Search, refund and create complimentary tickets.</p>
        </div>
        <a href="/api/admin/ticketing/export" className="btn-outline">Export CSV</a>
      </div>

      {msg && (
        <div style={{ marginBottom: "1.5rem", padding: "0.9rem 1.2rem", borderRadius: 12, fontSize: "0.85rem", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", color: "var(--text)" }}>
          {msg}
        </div>
      )}

      <div className="admin-table-container">
        <form onSubmit={search} className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Search name, phone, email, order or ticket ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="filter-input flex-1"
          />
          <button type="submit" className="btn-outline px-8 rounded-xl">Search</button>
        </form>
        {loading ? (
          <p style={{ color: "var(--text3)" }}>Searching…</p>
        ) : searched && orders.length === 0 ? (
          <p style={{ color: "var(--text3)" }}>No orders found.</p>
        ) : (
          orders.length > 0 && (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr><th>Order</th><th>Buyer</th><th>Items</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <div className="font-semibold text-gold">{o.orderCode}</div>
                        <div className="text-xs text-text3">{new Date(o.createdAt).toLocaleString("en-IN")}</div>
                      </td>
                      <td>
                        <div className="font-bold">{o.buyer?.name}</div>
                        <div className="text-xs text-text3">{o.buyer?.email}</div>
                        <div className="text-xs text-text3">{o.buyer?.phone}</div>
                      </td>
                      <td className="text-sm">{o.items?.map((i) => `${i.tierName} × ${i.qty}`).join(", ")}</td>
                      <td>₹{(o.totalPaise / 100).toLocaleString("en-IN")}</td>
                      <td><span className="admin-badge">{o.status}</span></td>
                      <td className="text-right">
                        {o.status === "PAID" && (
                          <button onClick={() => refund(o._id, o.orderCode)} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem" }}>
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <div className="admin-table-container" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.5rem" }}>Manual complimentary ticket</h2>
        <p className="admin-subtitle">Requires a ₹0 tier. Generates real ticket ID + QR.</p>
        <form onSubmit={createComp} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.8rem", marginTop: "1rem" }}>
          <input className="filter-input" required placeholder="Event slug" value={comp.slug} onChange={(e) => setComp({ ...comp, slug: e.target.value })} />
          <input className="filter-input" required placeholder="Tier code (e.g. GEN)" value={comp.tierCode} onChange={(e) => setComp({ ...comp, tierCode: e.target.value })} />
          <input className="filter-input" type="number" min={1} max={20} placeholder="Qty" value={comp.qty} onChange={(e) => setComp({ ...comp, qty: e.target.value })} />
          <input className="filter-input" required placeholder="Guest name" value={comp.name} onChange={(e) => setComp({ ...comp, name: e.target.value })} />
          <input className="filter-input" required type="email" placeholder="Guest email" value={comp.email} onChange={(e) => setComp({ ...comp, email: e.target.value })} />
          <input className="filter-input" required placeholder="Guest phone" value={comp.phone} onChange={(e) => setComp({ ...comp, phone: e.target.value })} />
          <button type="submit" className="btn-primary" style={{ justifyContent: "center" }}>Create comp tickets</button>
        </form>
      </div>
    </div>
  );
}
