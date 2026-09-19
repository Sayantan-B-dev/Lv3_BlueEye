"use client";

import { useEffect, useState } from "react";

interface Props {
  locked: boolean;
  message: string;
  children: React.ReactNode;
}

/**
 * Freezes a public events page while work is ongoing: the notice card is
 * dead-centred in the viewport and the real page is blurred and non-interactive
 * behind it. Add `?preview=1` to the URL for an unobstructed staff peek
 * without touching the admin switch.
 */
export default function EventLockGate({ locked, message, children }: Props) {
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (!locked) return;
    if (new URLSearchParams(window.location.search).get("preview") === "1") {
      setPreview(true);
    }
  }, [locked]);

  if (!locked || preview) return <>{children}</>;

  return (
    <>
      {/* Blurred page underneath — same visual height as the real page */}
      <div
        aria-hidden="true"
        style={{
          filter: "blur(8px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.45,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>

      {/* Dead-centred notice overlay */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1rem",
            maxWidth: 480,
            width: "100%",
            padding: "2.5rem 2rem",
            borderRadius: "1.25rem",
            background: "var(--bg2, #0f0f10)",
            border: "1px solid rgba(212,160,23,0.35)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--gold,#d4a017)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            Work Ongoing
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.95rem",
              lineHeight: 1.7,
              color: "var(--text2)",
            }}
          >
            {message}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "0.8rem",
              color: "var(--text3)",
            }}
          >
            Already bought a ticket? Your order confirmation and QR ticket links
            still work.
          </p>
        </div>
      </div>
    </>
  );
}
