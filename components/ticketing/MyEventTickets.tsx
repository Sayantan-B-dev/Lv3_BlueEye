"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

/** Shows the signed-in buyer's tickets for this event (nothing for guests). */
export default function MyEventTickets({ slug }: { slug: string }) {
  const { status } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch(`/api/ticketing/events/${slug}/mine`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data.length > 0) setTickets(d.data);
      })
      .catch(() => {});
  }, [slug, status]);

  if (status !== "authenticated" || tickets.length === 0) return null;

  return (
    <div style={{ padding: "1.5rem", background: "rgba(34,197,94,0.05)",
      border: "1px solid rgba(34,197,94,0.25)", borderRadius: "1rem" }}>
      <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.95rem", fontWeight: 800, color: "var(--text)" }}>
        Your tickets ({tickets.length})
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {tickets.map((t: any) => (
          <Link
            key={t.secureToken}
            href={`/my-ticket/${t.secureToken}`}
            style={{ fontSize: "0.82rem", color: "var(--gold)", textDecoration: "none",
              padding: "0.5rem 0.75rem", borderRadius: 10, background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {t.tierName} · {t.ticketCode} · {t.displayStatus.replace("_", " ")} →
          </Link>
        ))}
      </div>
    </div>
  );
}
