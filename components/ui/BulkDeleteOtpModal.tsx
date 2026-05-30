"use client";

import { useEffect, useRef, useState } from "react";

interface BulkDeleteOtpModalProps {
  isOpen: boolean;
  count: number;
  resource: string;
  onVerified: () => void;
  onCancel: () => void;
}

export default function BulkDeleteOtpModal({
  isOpen,
  count,
  resource,
  onVerified,
  onCancel,
}: BulkDeleteOtpModalProps) {
  const [step, setStep] = useState<"confirm" | "otp">("confirm");
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep("confirm");
      setOtp("");
      setError("");
    }
    if (isOpen && step === "otp") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleSendOtp = async () => {
    setSending(true);
    setError("");
    try {
      const res = await fetch("/api/admin/delete-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, resource }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("otp");
      } else {
        setError(data.message || "Failed to send OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) { setError("Please enter the OTP."); return; }
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/admin/delete-otp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json();
      if (data.success) {
        onVerified();
      } else {
        setError(data.message || "Invalid OTP.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-pop" style={{ maxWidth: 460 }}>
        {/* Header */}
        <div className="modal-header">
          <div
            className="modal-icon-wrap"
            style={{
              background: "rgba(var(--gold-rgb, 212, 160, 23), 0.1)",
              border: "1px solid rgba(var(--gold-rgb, 212, 160, 23), 0.25)",
              color: "var(--gold)",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="modal-title" style={{ color: "var(--gold)" }}>
            {step === "confirm"
              ? `Bulk Delete ${count} ${resource}`
              : "Enter OTP to Authorize"}
          </h2>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(var(--gold-rgb,212,160,23),0.15)", margin: "0 0 1.25rem" }} />

        {step === "confirm" ? (
          <>
            <p className="modal-message" style={{ marginBottom: "1.5rem" }}>
              You are about to <strong style={{ color: "var(--gold)" }}>permanently delete {count} {resource}</strong>.
              This action <strong>cannot be undone</strong>.
              <br /><br />
              A one-time password will be sent to your registered admin email address to authorize this operation.
            </p>

            {error && (
              <p style={{ color: "var(--gold)", fontSize: "0.85rem", textAlign: "center", marginBottom: "1rem", opacity: 0.8 }}>
                ⚠ {error}
              </p>
            )}

            <div className="modal-actions">
              <button onClick={onCancel} className="btn-modal-cancel">Cancel</button>
              <button
                onClick={handleSendOtp}
                disabled={sending}
                style={{
                  padding: "0.7rem 1.4rem",
                  background: "linear-gradient(135deg, var(--gold), var(--saffron))",
                  border: "none",
                  borderRadius: "10px",
                  color: "#0a0807",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.7 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {sending ? "Sending OTP…" : "Send OTP to Email"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-message" style={{ marginBottom: "1.25rem" }}>
              An OTP has been sent to your admin email. Enter it below to authorize deletion of{" "}
              <strong style={{ color: "var(--gold)" }}>{count} {resource}</strong>.
              Valid for <strong>5 minutes</strong>.
            </p>

            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="------"
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
              style={{
                width: "100%",
                textAlign: "center",
                fontSize: "2.2rem",
                fontWeight: 800,
                letterSpacing: "0.45em",
                padding: "0.85rem 1rem",
                background: "rgba(var(--gold-rgb,212,160,23),0.05)",
                border: "1px solid rgba(var(--gold-rgb,212,160,23),0.3)",
                borderRadius: 14,
                color: "var(--gold)",
                outline: "none",
                fontFamily: "monospace",
                marginBottom: error ? "0.5rem" : "1rem",
                boxSizing: "border-box",
              }}
            />

            {error && (
              <p style={{ color: "var(--gold)", fontSize: "0.85rem", textAlign: "center", marginBottom: "0.75rem", opacity: 0.8 }}>
                ⚠ {error}
              </p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={sending}
              style={{
                background: "none",
                border: "none",
                color: "var(--text3)",
                fontSize: "0.8rem",
                cursor: "pointer",
                display: "block",
                margin: "0 auto 1.25rem",
                textDecoration: "underline",
                opacity: sending ? 0.5 : 1,
              }}
            >
              {sending ? "Sending…" : "Resend OTP"}
            </button>

            <div className="modal-actions">
              <button onClick={onCancel} className="btn-modal-cancel">Cancel</button>
              <button
                onClick={handleVerifyOtp}
                disabled={verifying || otp.length < 6}
                style={{
                  padding: "0.7rem 1.4rem",
                  background: otp.length < 6 ? "rgba(var(--gold-rgb,212,160,23),0.2)" : "linear-gradient(135deg, var(--gold), var(--saffron))",
                  border: "none",
                  borderRadius: "10px",
                  color: otp.length < 6 ? "var(--text3)" : "#0a0807",
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: verifying || otp.length < 6 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {verifying ? "Verifying…" : "Confirm Delete"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
