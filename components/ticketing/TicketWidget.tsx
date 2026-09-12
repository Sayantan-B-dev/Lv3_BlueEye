"use client";

import { useEffect, useState } from "react";
import { trackPixel } from "@/components/analytics/MetaPixel";

interface Tier {
  code: string;
  name: string;
  pricePaise: number;
  remaining: number;
  status: string;
}

interface Quote {
  tierCode: string;
  tierName: string;
  unitPaise: number;
  qty: number;
  remaining: number;
  subtotalPaise: number;
  feePaise: number;
  gstPaise: number;
  totalPaise: number;
  currency: string;
}

function inr(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Payment gateway failed to load"));
    document.head.appendChild(s);
  });
}

type Phase = "select" | "details" | "processing" | "done";

export default function TicketWidget({ slug }: { slug: string }) {
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [maxPerOrder, setMaxPerOrder] = useState(6);
  const [tierCode, setTierCode] = useState("");
  const [qty, setQty] = useState(1);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [phase, setPhase] = useState<Phase>("select");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "", dob: "", city: "" });
  const [paidTickets, setPaidTickets] = useState<{ ticketCode: string; tierName: string; attendeeName: string; secureToken: string }[]>([]);
  const [orderCode, setOrderCode] = useState("");

  useEffect(() => {
    fetch(`/api/ticketing/events/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const avail = (d.data.tiers as Tier[]).filter((t) => t.status === "Active");
          setTiers(avail);
          setMaxPerOrder(d.data.config?.maxPerOrder || 6);
          const first = avail.find((t) => t.remaining > 0);
          if (first) setTierCode(first.code);
          trackPixel("ViewContent", { content_ids: [slug], content_type: "event" });
        } else {
          setError(d.message || "Ticketing unavailable");
        }
      })
      .catch(() => setError("Ticketing unavailable right now"))
      .finally(() => setLoading(false));
  }, [slug]);

  const activeTier = tiers.find((t) => t.code === tierCode);
  const maxQty = activeTier ? Math.min(activeTier.remaining, maxPerOrder) : 1;

  useEffect(() => {
    if (!tierCode || !qty) return;
    setQuote(null);
    const id = setTimeout(() => {
      fetch(`/api/ticketing/events/${slug}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierCode, qty }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            setQuote(d.data);
            setError("");
            trackPixel("AddToCart", { content_ids: [`${slug}:${tierCode}`], value: d.data.totalPaise / 100, currency: "INR" });
          } else {
            setError(d.message || "Cannot price tickets");
          }
        })
        .catch(() => setError("Cannot price tickets right now"));
    }, 350);
    return () => clearTimeout(id);
  }, [slug, tierCode, qty]);

  async function pollOrder(code: string, email: string) {
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/ticketing/orders/${code}?email=${encodeURIComponent(email)}`);
        const d = await res.json();
        if (d.success && d.data.status === "PAID") {
          setPaidTickets(d.data.tickets);
          setPhase("done");
          trackPixel("Purchase", { value: d.data.totalPaise / 100, currency: "INR", order_id: code });
          return;
        }
        if (d.success && ["FAILED", "CANCELLED", "REFUNDED"].includes(d.data.status)) {
          setError(`Payment ${d.data.status.toLowerCase()}. Contact support with order ${code}.`);
          setPhase("details");
          setPaying(false);
          return;
        }
      } catch {
        /* keep polling */
      }
    }
    setError(`Payment confirmation is taking long. Your tickets will arrive by email. Order: ${code}`);
    setPhase("details");
    setPaying(false);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!buyer.name.trim() || !buyer.email.trim() || buyer.phone.replace(/\D/g, "").length < 10) {
      setError("Enter your full name, valid email and 10-digit mobile number.");
      return;
    }
    setPaying(true);
    trackPixel("InitiateCheckout", { value: (quote?.totalPaise || 0) / 100, currency: "INR" });
    try {
      const res = await fetch(`/api/ticketing/events/${slug}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierCode, qty, buyer }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.message || "Order failed");
      setOrderCode(d.data.orderCode);
      await loadRazorpayScript();
      const rzp = new window.Razorpay({
        key: d.data.keyId,
        amount: d.data.totalPaise,
        currency: "INR",
        name: "Blue Eye Entertainment",
        order_id: d.data.gatewayOrderId,
        prefill: { name: buyer.name, email: buyer.email, contact: buyer.phone },
        theme: { color: "#d4a017" },
        handler: async (resp: any) => {
          // No webhook: confirm server-side (HMAC + captured check), then poll.
          try {
            await fetch("/api/ticketing/orders/confirm", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                gatewayOrderId: d.data.gatewayOrderId,
                gatewayPaymentId: resp.razorpay_payment_id,
                signature: resp.razorpay_signature,
              }),
            });
          } catch {
            /* poll below will surface the real state */
          }
          setPhase("processing");
          pollOrder(d.data.orderCode, buyer.email);
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setError("Payment window closed. No money was deducted.");
          },
        },
      });
      rzp.on("payment.failed", () => {
        setPaying(false);
        setError("Payment failed. Try again or use a different method.");
      });
      rzp.open();
    } catch (err: any) {
      setPaying(false);
      setError(err.message || "Could not start payment");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text3)", fontSize: "0.85rem" }}>
        Loading tickets…
      </div>
    );
  }

  if (phase === "processing") {
    return (
      <div style={{ padding: "2rem 1.5rem", textAlign: "center" }}>
        <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--gold)" }}>Confirming payment…</div>
        <p style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.75rem", lineHeight: 1.7 }}>
          Do not close this page. Your tickets appear here once the bank confirms.
          <br />Order: <strong>{orderCode}</strong>
        </p>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div style={{ padding: "1.5rem" }}>
        <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#22c55e", marginBottom: "0.25rem" }}>
          Booking confirmed
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text3)", marginBottom: "1rem" }}>
          Order {orderCode} · tickets also sent to {buyer.email}
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {paidTickets.map((t) => (
            <a
              key={t.secureToken}
              href={`/my-ticket/${t.secureToken}`}
              style={{
                display: "block", padding: "0.75rem 1rem", borderRadius: "12px",
                background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)",
                color: "#fff", textDecoration: "none", fontSize: "0.85rem",
              }}
            >
              <strong style={{ color: "var(--gold)" }}>{t.tierName}</strong> · {t.ticketCode}
              <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text3)" }}>View ticket + QR →</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "1.5rem" }}>
      <h3 style={{ margin: "0 0 1rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text)" }}>
        Book Tickets
      </h3>
      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.75rem", borderRadius: "10px", fontSize: "0.82rem", background: "rgba(255,107,107,0.1)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.2)" }}>
          {error}
        </div>
      )}

      <label className="form-label">Ticket Category</label>
      <select className="filter-select w-full" value={tierCode} onChange={(e) => setTierCode(e.target.value)}>
        {tiers.map((t) => (
          <option key={t.code} value={t.code} disabled={t.remaining <= 0}>
            {t.name} — ₹{(t.pricePaise / 100).toLocaleString("en-IN")}{t.remaining <= 0 ? " (Sold out)" : ` (${t.remaining} left)`}
          </option>
        ))}
      </select>

      <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "1rem 0" }}>
        <label className="form-label" style={{ margin: 0 }}>Quantity</label>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="btn-outline" style={{ width: 36, height: 36, padding: 0 }}>-</button>
          <strong style={{ minWidth: 24, textAlign: "center", color: "#fff" }}>{qty}</strong>
          <button type="button" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="btn-outline" style={{ width: 36, height: 36, padding: 0 }}>+</button>
        </div>
        <span style={{ fontSize: "0.75rem", color: "var(--text3)" }}>max {maxQty}</span>
      </div>

      {quote && (
        <div style={{ fontSize: "0.85rem", color: "var(--text2)", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><span>{quote.tierName} × {quote.qty}</span><span>{inr(quote.subtotalPaise)}</span></div>
          {quote.feePaise > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Convenience fee</span><span>{inr(quote.feePaise)}</span></div>}
          {quote.gstPaise > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>GST</span><span>{inr(quote.gstPaise)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, color: "#fff", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: "0.5rem", paddingTop: "0.5rem" }}>
            <span>Total</span><span style={{ color: "var(--gold)" }}>{inr(quote.totalPaise)}</span>
          </div>
        </div>
      )}

      {phase === "select" && (
        <button type="button" className="btn-primary w-full" disabled={!quote} onClick={() => setPhase("details")}>
          Continue →
        </button>
      )}

      {phase === "details" && (
        <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: "0.8rem", marginTop: "0.5rem" }}>
          <input className="filter-input" required placeholder="Full name" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
          <input className="filter-input" required type="email" placeholder="Email address" value={buyer.email} onChange={(e) => setBuyer({ ...buyer, email: e.target.value })} />
          <input className="filter-input" required type="tel" placeholder="Mobile number" value={buyer.phone} onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <input className="filter-input" placeholder="DOB (optional)" value={buyer.dob} onChange={(e) => setBuyer({ ...buyer, dob: e.target.value })} />
            <input className="filter-input" placeholder="City (optional)" value={buyer.city} onChange={(e) => setBuyer({ ...buyer, city: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full py-4 text-lg" disabled={paying || !quote}>
            {paying ? "Opening payment…" : `PAY ${quote ? inr(quote.totalPaise) : ""}`}
          </button>
          <button type="button" onClick={() => setPhase("select")} style={{ background: "none", border: "none", color: "var(--text3)", fontSize: "0.8rem", cursor: "pointer" }}>
            ← Change tickets
          </button>
        </form>
      )}
    </div>
  );
}
