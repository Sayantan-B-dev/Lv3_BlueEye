"use client";

import { useEffect, useRef, useState } from "react";

interface ScanResult {
  ok: boolean;
  message: string;
  ticket?: { ticketCode: string; tierName: string; attendeeName: string };
  firstCheckedInAt?: string | null;
}

function extractToken(input: string): string {
  const t = input.trim();
  const m = t.match(/\/my-ticket\/([a-f0-9]{32,})/i);
  return m ? m[1] : t;
}

export default function TicketCheckinPage() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [undoNote, setUndoNote] = useState("");
  const [undoing, setUndoing] = useState(false);
  const [lastToken, setLastToken] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number>(0);

  async function submitToken(raw: string) {
    const token = extractToken(raw);
    if (!token) return;
    setScanning(true);
    setLastToken(token);
    try {
      const res = await fetch("/api/tickets/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await res.json();
      if (d.success) {
        setResult({ ok: true, message: "ENTRY APPROVED", ticket: d.data });
      } else {
        setResult({
          ok: false,
          message: d.message || "Invalid ticket",
          ticket: d.errors?.ticket,
          firstCheckedInAt: d.errors?.firstCheckedInAt || null,
        });
      }
    } catch {
      setResult({ ok: false, message: "Network error, try again" });
    } finally {
      setScanning(false);
    }
  }

  async function undoLast() {
    if (!lastToken) return;
    if (!undoNote.trim()) {
      setResult({ ok: false, message: "Write a reason note to revert a check-in" });
      return;
    }
    setUndoing(true);
    try {
      const res = await fetch("/api/tickets/checkin/undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: lastToken, note: undoNote }),
      });
      const d = await res.json();
      setResult(
        d.success
          ? { ok: true, message: d.message, ticket: d.data }
          : { ok: false, message: d.message || "Undo failed" }
      );
      if (d.success) setUndoNote("");
    } catch {
      setResult({ ok: false, message: "Network error" });
    } finally {
      setUndoing(false);
    }
  }

  async function startCamera() {
    setCameraError("");
    const Detector = (window as any).BarcodeDetector;
    if (!Detector) {
      setCameraError("Camera scanning is not supported on this device. Use manual entry below.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      const detector = new Detector({ formats: ["qr_code"] });
      const loop = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          loopRef.current = requestAnimationFrame(loop);
          return;
        }
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes?.length) {
            await submitToken(codes[0].rawValue || "");
            stopCamera();
            return;
          }
        } catch {
          /* keep looping */
        }
        loopRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch {
      setCameraError("Camera permission denied. Use manual entry below.");
    }
  }

  function stopCamera() {
    cancelAnimationFrame(loopRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="fade-in">
      <div className="mb-10">
        <h1 className="admin-title">Ticket <span className="text-gold">Check-in</span></h1>
        <p className="admin-subtitle">Scan attendee QR codes at the venue gate.</p>
      </div>

      {!cameraOn ? (
        <button onClick={startCamera} className="btn-primary" style={{ marginBottom: "1.5rem" }}>
          Open camera scanner
        </button>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          <video ref={videoRef} playsInline muted style={{ width: "100%", maxWidth: 420, borderRadius: 16, border: "1px solid var(--border)" }} />
          <div><button onClick={stopCamera} className="btn-outline" style={{ marginTop: "0.75rem" }}>Stop camera</button></div>
        </div>
      )}
      {cameraError && <p style={{ color: "var(--text3)", fontSize: "0.85rem", marginBottom: "1rem" }}>{cameraError}</p>}

      <div className="admin-table-container">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitToken(input);
            setInput("");
          }}
          className="flex gap-4"
        >
          <input
            type="text"
            className="filter-input flex-1"
            placeholder="Paste ticket link or token…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" className="btn-primary px-8" disabled={scanning}>
            {scanning ? "Checking…" : "Verify"}
          </button>
        </form>

        {result && (
          <div
            style={{
              marginTop: "1.5rem", padding: "1.5rem", borderRadius: 16, textAlign: "center",
              background: result.ok ? "rgba(34,197,94,0.08)" : "rgba(255,107,107,0.08)",
              border: result.ok ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,107,107,0.4)",
            }}
          >
            <div style={{ fontSize: "1.3rem", fontWeight: 900, color: result.ok ? "#22c55e" : "#ff6b6b" }}>
              {result.message}
            </div>
            {result.ticket && (
              <div style={{ marginTop: "0.75rem", color: "var(--text)", fontSize: "0.95rem" }}>
                <div style={{ fontWeight: 700 }}>{result.ticket.attendeeName}</div>
                <div style={{ color: "var(--gold)", fontWeight: 700 }}>{result.ticket.tierName} · {result.ticket.ticketCode}</div>
              </div>
            )}
            {result.firstCheckedInAt && (
              <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text3)" }}>
                First checked in: {new Date(result.firstCheckedInAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </div>
            )}
            {result.ok && result.ticket && (
              <div style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
                <div style={{ fontSize: "0.8rem", color: "var(--text3)", marginBottom: "0.5rem" }}>
                  Mis-scan? Revert this check-in with a reason (logged).
                </div>
                <div className="flex gap-4" style={{ justifyContent: "center", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    className="filter-input"
                    style={{ maxWidth: 280 }}
                    placeholder="Reason, e.g. scanned wrong person"
                    value={undoNote}
                    onChange={(e) => setUndoNote(e.target.value)}
                  />
                  <button onClick={undoLast} disabled={undoing} className="btn-outline">
                    {undoing ? "Reverting…" : "Undo check-in"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
