"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminEditArtistButton({ artistId }: { artistId: string }) {
  const { data: session } = useSession();
  const isAdmin = session?.user && (session.user as { role?: string }).role === "admin";

  if (!isAdmin) return null;

  return (
    <Link
      href={`/admin/artists/${artistId}/edit`}
      className="btn-outline"
      style={{
        fontSize: "0.8rem",
        textDecoration: "none",
        color: "var(--gold,#d4a017)",
        borderColor: "var(--gold,#d4a017)44",
        borderRadius: "8px",
        padding: "6px 14px",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Edit Artist (Admin) ✦
    </Link>
  );
}
