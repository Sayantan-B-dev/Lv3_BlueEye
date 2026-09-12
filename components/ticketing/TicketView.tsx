"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import QRCode from "qrcode";

interface TicketData {
  ticketCode: string;
  tierName: string;
  attendeeName: string;
  status: string;
  checkedInAt: string | null;
  orderCode: string;
  event: {
    title: string;
    slug: string;
    startDate: string;
    endDate?: string;
    venue?: { name?: string; city?: string; state?: string; address?: string };
    coverImage?: string;
    contactInfo?: { name?: string; phone?: string; email?: string } | null;
  } | null;
}

export default function TicketView({ token }: { token: string }) {
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";
  const [data, setData] = useState<TicketData | null>(null);
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkMsg, setCheckMsg] = useState("");

  useEffect(() => {
    fetch(`/api/tickets/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d.data);
        else setError(d.message || "Ticket not found");
      })
      .catch(() => setError("Could not load ticket"));
    QRCode.toDataURL(window.location.href, { margin: 2, width: 360 }).then(setQr).catch(() => {});
  }, [token]);

  async function handleCheckin() {
    setCheckingIn(true);
    setCheckMsg("");
    try {
      const res = await fetch("/api/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) {
        setCheckMsg("ENTRY APPROVED");
        setData((prev) => (prev ? { ...prev, status: "CHECKED_IN", checkedInAt: d.data.checkedInAt } : prev));
      } else {
        setCheckMsg(d.message || "Check-in failed");
      }
    } catch {
      setCheckMsg("Network error");
    } finally {
      setCheckingIn(false);
    }
  }

  if (error) {
    return (
      <div className="section-inner" style={{ paddingTop: "calc(var(--hdr-h) + 3rem)", textAlign: "center" }}>
        <h1 style={{ color: "var(--text)", fontSize: "1.4rem", fontWeight: 800 }}>Ticket not found</h1>
        <p style={{ color: "var(--text3)" }}>This link is invalid or the ticket was removed.</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="section-inner" style={{ paddingTop: "calc(var(--hdr-h) + 3rem)", textAlign: "center", color: "var(--text3)" }}>
        Loading ticket…
      </div>
    );
  }

  const ev = data.event;
  const dateStr = ev?.startDate ? new Date(ev.startDate).toLocaleString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
  const venueStr = [ev?.venue?.name, ev?.venue?.city, ev?.venue?.state].filter(Boolean).join(", ");

  return (
    <div className="section-inner" style={{ paddingTop: "calc(var(--hdr-h) + 2rem)", paddingBottom: "4rem", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, overflow: "hidden" }}>
        <div style={{ padding: "2rem 2rem 1.5rem", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "linear-gradient(180deg, #131720 0%, var(--surface) 100%)" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.3em", color: "var(--gold)", fontWeight: 800 }}>BLUE EYE ENTERTAINMENT</div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff", margin: "0.5rem 0 0" }}>{ev?.title || "Event Ticket"}</h1>
          <div style={{ display: "inline-block", marginTop: "0.75rem", padding: "0.25rem 0.9rem", borderRadius: 999, background: "rgba(212,160,23,0.12)", color: "var(--gold)", fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.08em" }}>
            {data.tierName.toUpperCase()} TICKET
          </div>
        </div>
        <div style={{ padding: "1.5rem 2rem" }}>
          <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "#fff" }}>{data.attendeeName}</div>
          <div style={{ fontSize: "0.82rem", color: "var(--text3)", marginTop: "0.25rem" }}>Ticket ID: {data.ticketCode} · Order: {data.orderCode}</div>
          {dateStr && <div style={{ fontSize: "0.85rem", color: "var(--text2)", marginTop: "0.75rem" }}>{dateStr}</div>}
          {venueStr && <div style={{ fontSize: "0.85rem", color: "var(--text2)" }}>{venueStr}</div>}
          {qr && (
            <div style={{ display: "flex", justifyContent: "center", margin: "1.5rem 0 0.5rem", padding: "1rem", background: "#fff", borderRadius: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Entry QR code" width={240} height={240} />
            </div>
          )}
          <div style={{ textAlign: "center", fontSize: "0.8rem", fontWeight: 700, marginTop: "0.5rem", color: data.status === "CHECKED_IN" ? "#4cc9f0" : data.status === "ACTIVE" ? "#22c55e" : "#ff6b6b" }}>
            {data.status === "CHECKED_IN"
              ? `CHECKED IN${data.checkedInAt ? ` · ${new Date(data.checkedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}`
              : data.status === "ACTIVE" ? "VALID · SHOW AT ENTRY" : `TICKET ${data.status}`}
          </div>
          {ev?.contactInfo?.phone && (
            <div style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text3)", marginTop: "1rem" }}>
              Support: {ev.contactInfo.phone}{ev.contactInfo.email ? ` · ${ev.contactInfo.email}` : ""}
            </div>
          )}
          {isAdmin && data.status === "ACTIVE" && (
            <button onClick={handleCheckin} disabled={checkingIn} className="btn-primary w-full" style={{ marginTop: "1.25rem", justifyContent: "center" }}>
              {checkingIn ? "Checking in…" : "Check In (staff)"}
            </button>
          )}
          {checkMsg && (
            <div style={{ textAlign: "center", fontWeight: 800, marginTop: "0.75rem", color: checkMsg.includes("APPROVED") ? "#22c55e" : "#ff6b6b" }}>
              {checkMsg}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
