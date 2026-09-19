"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Tier {
  _id?: string;
  code: string;
  name: string;
  pricePaise: number;
  totalQty: number;
  soldQty: number;
  remaining: number;
  status: string;
}

interface Dashboard {
  capacity: number;
  sold: number;
  tiers: Tier[];
  orders: number;
  orderStatus: Record<string, number>;
  revenuePaise: number;
  checkedIn: number;
  activeTickets: number;
}

interface Evt {
  _id: string;
  title: string;
  slug: string;
  status: string;
  startDate: string;
  ticketing?: { enabled?: boolean; feePct?: number; feeFlatPaise?: number; gstPct?: number; maxPerOrder?: number; locked?: boolean; lockMessage?: string };
  highlights?: string[];
  termsConditions?: string;
  refundPolicy?: string;
  contactInfo?: { name?: string; phone?: string; email?: string };
}

interface Order {
  _id: string;
  orderCode: string;
  eventId?: string;
  buyer?: { name: string; email: string; phone: string };
  items?: { tierName: string; qty: number }[];
  totalPaise: number;
  status: string;
  createdAt: string;
}

const REFRESH_MS = 20000;

export default function TicketingDashboardPage() {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";
  const [events, setEvents] = useState<Evt[]>([]);
  const [eventId, setEventId] = useState("");
  const [stats, setStats] = useState<Dashboard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Tier editor (admin)
  const [tierDrafts, setTierDrafts] = useState<Record<string, { price: string; qty: string; status: string }>>({});
  const [savingTier, setSavingTier] = useState<string | null>(null);
  // Config editor (admin)
  const [cfg, setCfg] = useState({ enabled: false, feePct: "0", feeFlat: "0", gstPct: "0", maxPerOrder: "6", locked: false, lockMessage: "" });
  const [page, setPage] = useState({ highlights: "", terms: "", refund: "", cname: "", cphone: "", cemail: "" });
  const [savingCfg, setSavingCfg] = useState(false);

  const selected = events.find((e) => e._id === eventId);

  const load = useCallback(
    async (eid: string, silent = false) => {
      if (!silent) setLoading(true);
      try {
        const [s, o] = await Promise.all([
          fetch(`/api/admin/ticketing/dashboard${eid ? `?eventId=${eid}` : ""}`).then((r) => r.json()),
          fetch(`/api/admin/ticketing/orders?q=`).then((r) => r.json()),
        ]);
        if (s.success) {
          setStats(s.data);
          const drafts: Record<string, { price: string; qty: string; status: string }> = {};
          for (const t of s.data.tiers as Tier[]) {
            drafts[t.code] = {
              price: String(t.pricePaise / 100),
              qty: String(t.totalQty),
              status: t.status,
            };
          }
          setTierDrafts(drafts);
        } else if (!silent) {
          setMsg(s.message || "Failed to load stats");
        }
        if (o.success) {
          const all = o.data as Order[];
          setAllOrders(all);
          setOrders((eid ? all.filter((x) => String(x.eventId) === String(eid)) : all).slice(0, 10));
        }
        setUpdatedAt(new Date());
      } catch {
        if (!silent) setMsg("Failed to load ticketing data");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetch("/api/events?limit=50")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.events || []) as Evt[];
        if (list.length > 0) {
          setEvents(list);
          const ticked = list.find((e) => e.ticketing?.enabled);
          const first = (ticked || list[0])._id || "";
          setEventId(first);
          load(first);
        } else {
          setMsg(d.error || "No events found");
          setLoading(false);
        }
      })
      .catch(() => {
        setMsg("Failed to load events");
        setLoading(false);
      });
  }, [load]);

  useEffect(() => {
    if (!eventId) return;
    const ev = events.find((e) => e._id === eventId);
    if (ev?.ticketing) {
      setCfg({
        enabled: !!ev.ticketing.enabled,
        feePct: String(ev.ticketing.feePct ?? 0),
        feeFlat: String((ev.ticketing.feeFlatPaise ?? 0) / 100),
        gstPct: String(ev.ticketing.gstPct ?? 0),
        maxPerOrder: String(ev.ticketing.maxPerOrder ?? 6),
        locked: !!ev.ticketing.locked,
        lockMessage: ev.ticketing.lockMessage || "",
      });
    }
    if (ev) {
      setPage({
        highlights: (ev.highlights || []).join("\n"),
        terms: ev.termsConditions || "",
        refund: ev.refundPolicy || "",
        cname: ev.contactInfo?.name || "",
        cphone: ev.contactInfo?.phone || "",
        cemail: ev.contactInfo?.email || "",
      });
    }
    load(eventId);
  }, [eventId, events, load]);

  useEffect(() => {
    if (!eventId) return;
    const id = setInterval(() => load(eventId, true), REFRESH_MS);
    return () => clearInterval(id);
  }, [eventId, load]);

  const [ago, setAgo] = useState("");
  useEffect(() => {
    const id = setInterval(() => {
      if (!updatedAt) return;
      const s = Math.floor((Date.now() - updatedAt.getTime()) / 1000);
      setAgo(s < 5 ? "just now" : `${s}s ago`);
    }, 1000);
    return () => clearInterval(id);
  }, [updatedAt]);

  async function saveTier(code: string) {
    const d = tierDrafts[code];
    const tier = stats?.tiers.find((t) => t.code === code);
    if (!d || !tier || !eventId) return;
    setSavingTier(code);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/ticketing/events/${eventId}/tiers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name: tier.name,
          pricePaise: Math.round(Number(d.price) * 100),
          totalQty: Number(d.qty),
          status: d.status,
        }),
      });
      const j = await res.json();
      setMsg(j.success ? `${tier.name} saved.` : j.message || "Save failed");
      if (j.success) load(eventId, true);
    } catch {
      setMsg("Network error");
    } finally {
      setSavingTier(null);
    }
  }

  async function saveConfig() {
    if (!eventId) return;
    setSavingCfg(true);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/ticketing/events/${eventId}/config`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketing: {
            enabled: cfg.enabled,
            feePct: Number(cfg.feePct) || 0,
            feeFlatPaise: Math.round(Number(cfg.feeFlat) * 100) || 0,
            gstPct: Number(cfg.gstPct) || 0,
            maxPerOrder: Number(cfg.maxPerOrder) || 6,
            locked: cfg.locked,
            lockMessage: cfg.lockMessage,
          },
          highlights: page.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
          termsConditions: page.terms,
          refundPolicy: page.refund,
          contactInfo: { name: page.cname, phone: page.cphone, email: page.cemail },
        }),
      });
      const j = await res.json();
      setMsg(j.success ? "Ticketing settings saved." : j.message || "Save failed");
      if (j.success) {
        const er = await fetch("/api/events?limit=50").then((r) => r.json());
        if (Array.isArray(er.events)) setEvents(er.events);
        load(eventId, true);
      }
    } catch {
      setMsg("Network error");
    } finally {
      setSavingCfg(false);
    }
  }

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

  // Revenue momentum — last 14 days, scoped to selected event when set.
  const salesData = (() => {
    const inScope = eventId ? allOrders.filter((o) => String(o.eventId) === String(eventId)) : allOrders;
    const byDay = new Map<string, number>();
    for (const o of inScope) {
      if (o.status !== "PAID") continue;
      const day = new Date(o.createdAt).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) || 0) + o.totalPaise / 100);
    }
    const out: { day: string; revenue: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const key = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      out.push({ day: key.slice(5), revenue: Math.round(byDay.get(key) || 0) });
    }
    return out;
  })();

  const checkinPct = stats && stats.sold > 0 ? Math.round((stats.checkedIn / stats.sold) * 100) : 0;

  return (
    <div className="fade-in">
      <div className="flex justify-between items-end mb-10" style={{ flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="admin-title">Event <span className="text-gold">Ticketing</span></h1>
          <p className="admin-subtitle">
            {selected ? `${selected.title} · ` : ""}live sales, inventory and buyers
            {updatedAt && <span style={{ color: "var(--text3)" }}> · updated {ago}</span>}
          </p>
        </div>
        <div className="flex gap-4 items-center" style={{ flexWrap: "wrap" }}>
          <select
            className="filter-select"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ minWidth: 200 }}
          >
            <option value="">All events</option>
            {events.map((e) => (
              <option key={e._id} value={e._id}>
                {e.title}{e.ticketing?.enabled ? " ●" : ""}
              </option>
            ))}
          </select>
          <button onClick={() => eventId && load(eventId)} className="btn-outline">Refresh</button>
          <Link href="/admin/ticketing/orders" className="btn-outline">Orders</Link>
          <Link href="/admin/ticketing/checkin" className="btn-outline">Scanner</Link>
        </div>
      </div>

      {selected && (
        <div className="flex gap-4 items-center" style={{ marginBottom: "1.5rem", flexWrap: "wrap", fontSize: "0.82rem", color: "var(--text3)" }}>
          <span className="admin-badge">{selected.status}</span>
          <Link href={`/events/${selected.slug}`} target="_blank" style={{ color: "var(--gold)" }}>View public page →</Link>
          {isAdmin && (
            <Link href={`/admin/events/${selected._id}`} style={{ color: "var(--gold)" }}>Manage in Events →</Link>
          )}
        </div>
      )}

      {msg && (
        <div style={{ marginBottom: "1.5rem", padding: "0.9rem 1.2rem", borderRadius: 12, fontSize: "0.85rem", background: "rgba(212,160,23,0.08)", border: "1px solid rgba(212,160,23,0.25)", color: "var(--text)" }}>
          {msg}
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--text3)" }}>Loading stats…</p>
      ) : !stats ? (
        <p style={{ color: "var(--text3)" }}>No ticketing data yet. Enable ticketing on an event first.</p>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {cards.map((c) => (
              <div key={c.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--gold)", whiteSpace: "nowrap" }}>{c.value}</div>
                <div className="admin-subtitle" style={{ margin: 0 }}>{c.label}</div>
              </div>
            ))}
          </div>

          <div className="admin-card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.25rem" }}>
              <span className="admin-live-dot" aria-hidden="true" />Revenue momentum — last 14 days
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={salesData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="tixRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a017" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#d4a017" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "var(--text3)", fontSize: 11 }} tickLine={false} axisLine={false} interval={2} />
                <YAxis tick={{ fill: "var(--text3)", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: "0.82rem", color: "var(--text)" }}
                  labelStyle={{ color: "var(--text3)" }}
                  formatter={(v: any) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#d4a017" strokeWidth={2} fill="url(#tixRev)" />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ marginTop: "1rem" }}>
              <div className="flex justify-between items-center" style={{ fontSize: "0.82rem", color: "var(--text2)", marginBottom: "0.4rem" }}>
                <span>Check-in progress</span>
                <span style={{ fontWeight: 700, color: "var(--text)" }}>{stats.checkedIn}/{stats.sold} ({checkinPct}%)</span>
              </div>
              <div className="admin-progress-track">
                <div className="admin-progress-fill" style={{ width: `${checkinPct}%` }} />
              </div>
            </div>
          </div>

          <div className="admin-table-container">
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: "1rem" }}>
              Inventory by category{isAdmin ? " — edit price / quantity live" : ""}
            </h2>
            <div className="overflow-x-auto">
              <table className="admin-table admin-table--flow">
                <thead>
                  <tr><th>Category</th><th>Price (₹)</th><th>Total</th><th>Sold</th><th>Remaining</th><th>Status</th>{isAdmin && <th className="text-right">Save</th>}</tr>
                </thead>
                <tbody>
                  {stats.tiers.map((t) => (
                    <tr key={t.code}>
                      <td className="font-semibold text-gold" style={{ whiteSpace: "nowrap" }}>{t.name}</td>
                      <td>
                        {isAdmin ? (
                          <input
                            type="number" min={0} className="filter-input"
                            style={{ width: 110 }}
                            value={tierDrafts[t.code]?.price ?? ""}
                            onChange={(e) => setTierDrafts((p) => ({ ...p, [t.code]: { ...p[t.code], price: e.target.value } }))}
                          />
                        ) : (
                          <>₹{(t.pricePaise / 100).toLocaleString("en-IN")}</>
                        )}
                      </td>
                      <td>
                        {isAdmin ? (
                          <input
                            type="number" min={0} className="filter-input"
                            style={{ width: 90 }}
                            value={tierDrafts[t.code]?.qty ?? ""}
                            onChange={(e) => setTierDrafts((p) => ({ ...p, [t.code]: { ...p[t.code], qty: e.target.value } }))}
                          />
                        ) : (
                          <>{t.totalQty}</>
                        )}
                      </td>
                      <td>{t.soldQty}</td>
                      <td>{t.remaining}</td>
                      <td>
                        {isAdmin ? (
                          <select
                            className="filter-select"
                            value={tierDrafts[t.code]?.status ?? t.status}
                            onChange={(e) => setTierDrafts((p) => ({ ...p, [t.code]: { ...p[t.code], status: e.target.value } }))}
                          >
                            <option value="Active">Active</option>
                            <option value="SoldOut">SoldOut</option>
                            <option value="Disabled">Disabled</option>
                          </select>
                        ) : (
                          <>{t.status}</>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="text-right">
                          <button onClick={() => saveTier(t.code)} disabled={savingTier === t.code} className="btn-outline" style={{ fontSize: "0.78rem", padding: "0.4rem 0.8rem", whiteSpace: "nowrap" }}>
                            {savingTier === t.code ? "Saving…" : "Save"}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {isAdmin && selected && (
            <div className="admin-table-container" style={{ marginTop: "1.5rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", marginBottom: "1rem" }}>Ticketing settings — {selected.title}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.8rem", marginBottom: "1rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>
                  <input type="checkbox" checked={cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Ticketing enabled
                </label>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>
                  <input type="checkbox" checked={cfg.locked} onChange={(e) => setCfg({ ...cfg, locked: e.target.checked })} /> Freeze this event page
                </label>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Fee %<input type="number" min={0} className="filter-input" value={cfg.feePct} onChange={(e) => setCfg({ ...cfg, feePct: e.target.value })} /></label>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Flat fee ₹<input type="number" min={0} className="filter-input" value={cfg.feeFlat} onChange={(e) => setCfg({ ...cfg, feeFlat: e.target.value })} /></label>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>GST %<input type="number" min={0} className="filter-input" value={cfg.gstPct} onChange={(e) => setCfg({ ...cfg, gstPct: e.target.value })} /></label>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Max / order<input type="number" min={1} className="filter-input" value={cfg.maxPerOrder} onChange={(e) => setCfg({ ...cfg, maxPerOrder: e.target.value })} /></label>
              </div>
              <label style={{ fontSize: "0.8rem", color: "var(--text2)", display: "block", marginBottom: "0.8rem" }}>
                Freeze message (this event)
                <input
                  className="filter-input"
                  style={{ marginTop: "0.3rem" }}
                  placeholder="Defaults to a generic work-ongoing note"
                  value={cfg.lockMessage}
                  onChange={(e) => setCfg({ ...cfg, lockMessage: e.target.value })}
                />
              </label>
              <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Highlights (one per line)<textarea rows={3} className="filter-input" value={page.highlights} onChange={(e) => setPage({ ...page, highlights: e.target.value })} style={{ marginTop: "0.3rem" }} /></label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginTop: "0.8rem" }}>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Terms & conditions<textarea rows={3} className="filter-input" value={page.terms} onChange={(e) => setPage({ ...page, terms: e.target.value })} style={{ marginTop: "0.3rem" }} /></label>
                <label style={{ fontSize: "0.8rem", color: "var(--text2)" }}>Refund policy<textarea rows={3} className="filter-input" value={page.refund} onChange={(e) => setPage({ ...page, refund: e.target.value })} style={{ marginTop: "0.3rem" }} /></label>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.8rem", marginTop: "0.8rem" }}>
                <input className="filter-input" placeholder="Support name" value={page.cname} onChange={(e) => setPage({ ...page, cname: e.target.value })} />
                <input className="filter-input" placeholder="Support phone" value={page.cphone} onChange={(e) => setPage({ ...page, cphone: e.target.value })} />
                <input className="filter-input" placeholder="Support email" value={page.cemail} onChange={(e) => setPage({ ...page, cemail: e.target.value })} />
              </div>
              <button onClick={saveConfig} disabled={savingCfg} className="btn-primary" style={{ marginTop: "1rem" }}>
                {savingCfg ? "Saving…" : "Save ticketing settings"}
              </button>
            </div>
          )}

          <div className="admin-table-container" style={{ marginTop: "1.5rem" }}>
            <div className="flex justify-between items-center" style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text)", margin: 0 }}>Recent orders</h2>
              <Link href="/admin/ticketing/orders" style={{ fontSize: "0.82rem", color: "var(--gold)" }}>All orders →</Link>
            </div>
            {orders.length === 0 ? (
              <p style={{ color: "var(--text3)", fontSize: "0.85rem" }}>No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="admin-table admin-table--flow">
                  <thead>
                    <tr><th>Order</th><th>Buyer</th><th>Items</th><th>Amount</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o._id}>
                        <td>
                          <div className="font-semibold text-gold" style={{ whiteSpace: "nowrap" }}>{o.orderCode}</div>
                          <div className="text-xs text-text3" style={{ whiteSpace: "nowrap" }}>{new Date(o.createdAt).toLocaleString("en-IN")}</div>
                        </td>
                        <td>
                          <div className="font-bold">{o.buyer?.name || "—"}</div>
                          <div className="text-xs text-text3">{o.buyer?.email || ""}</div>
                          <div className="text-xs text-text3">{o.buyer?.phone || ""}</div>
                        </td>
                        <td className="text-sm">{o.items?.map((i) => `${i.tierName} × ${i.qty}`).join(", ")}</td>
                        <td style={{ whiteSpace: "nowrap" }}>₹{(o.totalPaise / 100).toLocaleString("en-IN")}</td>
                        <td><span className="admin-badge" style={{ whiteSpace: "nowrap" }}>{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
