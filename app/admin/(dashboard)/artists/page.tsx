"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";
import BulkDeleteOtpModal from "@/components/ui/BulkDeleteOtpModal";

const Checkbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div 
    onClick={onChange}
    className={`admin-checkbox ${checked ? 'checked' : ''}`}
  >
    {checked && (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    )}
  </div>
);

export default function AdminArtistsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stats, setStats] = useState({ total: 0, withImages: 0 });
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [otpModal, setOtpModal] = useState(false);
  const [pendingBulkDeleteIds, setPendingBulkDeleteIds] = useState<string[]>([]);

  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [missing, setMissing] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState("");
  const [gotoPage, setGotoPage] = useState("");
  const limit = 20;

  const fetchId = useRef(0);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/filters");
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.categories);
        }
      } catch {
        console.error("Failed to fetch categories");
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const id = ++fetchId.current;
    const loadArtists = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        if (query) params.set("q", query);
        if (category) params.set("category", category);
        if (missing) params.set("missing", missing);
        params.set("page", String(page));

        const res = await fetch(`/api/artists?${params.toString()}`);
        const data = await res.json();
        if (id !== fetchId.current) return;
        if (data.success) {
          setArtists(data.data.artists);
          setStats({ 
            total: data.data.total, 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            withImages: data.data.artists.filter((a: any) => a.media?.images?.length > 0).length 
          });
          setTotalPages(data.data.totalPages || 1);
        }
      } catch {
        if (id === fetchId.current) {
          console.error("Failed to fetch artists");
        }
      } finally {
        if (id === fetchId.current) {
          setLoading(false);
        }
      }
    };
    loadArtists();
  }, [query, category, missing, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQuery(search);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleMissingChange = (value: string) => {
    setMissing(value);
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === artists.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(artists.map(a => a._id));
    }
  };

  const handleDelete = (id: string) => {
    setModal({
      isOpen: true,
      title: "Delete Artist",
      message: "Are you sure you want to delete this artist? This action cannot be undone.",
      onConfirm: () => {
        setModal({
          isOpen: true,
          title: "⚠️ Final Confirmation",
          message: "This is your FINAL warning. The artist will be permanently removed from the database. Proceed?",
          onConfirm: async () => {
            try {
              const res = await fetch(`/api/artists/id/${id}`, { method: 'DELETE' });
              const data = await res.json();
              if (data.success) {
                setArtists(prev => prev.filter(a => a._id !== id));
              }
            } catch {
              console.error("Failed to delete artist");
            }
          }
        });
      }
    });
  };

  const handleBulkDelete = () => {
    setPendingBulkDeleteIds([...selectedIds]);
    setOtpModal(true);
  };

  const executeBulkDelete = async () => {
    try {
      const res = await fetch(`/api/artists`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: pendingBulkDeleteIds })
      });
      const data = await res.json();
      if (data.success) {
        setArtists(prev => prev.filter(a => !pendingBulkDeleteIds.includes(a._id)));
        setSelectedIds([]);
      }
    } catch {
      console.error("Failed to delete artists");
    } finally {
      setOtpModal(false);
      setPendingBulkDeleteIds([]);
    }
  };

  const missingLabel = missing
    ? `Missing ${missing === "both" ? "Images & Videos" : missing.charAt(0).toUpperCase() + missing.slice(1)}`
    : null;

  return (
    <div className="fade-in">
      <div className="flex justify-between items-end mb-10 gap-8" >
        <div>
          <h1 className="admin-title">
            Artist <span className="text-gold">Directory</span>
          </h1>
          <p className="admin-subtitle">Manage your database of {stats.total} artists across India.</p>
        </div>
        
        <div className="flex gap-4">
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="btn-outline border-crimson text-crimson bg-crimson/10 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <Link href="/admin/artists/new" className="btn-primary py-3 px-6 rounded-xl shadow-gold/20">
            + Create New Artist
          </Link>
        </div>
      </div>

      <div className="admin-table-container" style={{ marginTop: "1rem", maxWidth: "100%" }}>
        <form onSubmit={handleSearch} className="flex gap-3 my-6 flex-wrap" style={{ alignItems: "center" }}>
          <div className="relative" style={{ flex: "1 1 180px", minWidth: "160px" }}>
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="filter-input"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
          </div>
          <button type="submit" className="btn-outline rounded-xl" style={{ padding: "0.6rem 1rem", fontSize: "0.85rem", flex: "0 0 auto" }}>Search</button>

          <select
            value={category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            style={{
              flex: "0 0 auto",
              minWidth: "140px",
              width: "auto",
              padding: "0.6rem 0.8rem",
              borderRadius: "12px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "0.85rem",
            }}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={missing}
            onChange={(e) => handleMissingChange(e.target.value)}
            style={{
              flex: "0 0 auto",
              minWidth: "150px",
              width: "auto",
              padding: "0.6rem 0.8rem",
              borderRadius: "12px",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "0.85rem",
            }}
          >
            <option value="">All Media</option>
            <option value="images">Missing Images</option>
            <option value="videos">Missing Videos</option>
            <option value="both">Missing Images & Videos</option>
          </select>
        </form>

        {missingLabel && (
          <div className="text-sm text-gold mb-4" style={{ opacity: 0.8 }}>
            Showing artists with: <strong>{missingLabel}</strong>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '48px' }}>
                  <Checkbox checked={selectedIds.length === artists.length && artists.length > 0} onChange={toggleSelectAll} />
                </th>
                <th>Artist</th>
                <th>Category</th>
                <th>Location</th>
                <th>Media Assets</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16">Loading artists...</td></tr>
              ) : artists.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">No artists found.</td></tr>
              ) : artists.map((artist) => (
                <tr key={artist._id}>
                  <td style={{ width: '48px' }}>
                    <Checkbox checked={selectedIds.includes(artist._id)} onChange={() => toggleSelect(artist._id)} />
                  </td>
                  <td>
                    <div className="flex items-center gap-4">
                      <div className="admin-artist-thumb">
                        <img 
                          src={artist.media?.images?.[0] ? (artist.media.images[0].startsWith('http') ? artist.media.images[0] : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${artist.media.images[0]}`) : "https://placehold.co/100x100/1a1a1a/d4a017?text=Artist"} 
                          alt={artist.name ? `${artist.name} profile picture` : "Artist profile picture"}
                        />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{artist.name}</div>
                        <div className="text-xs text-text3">{artist.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge">{artist.category}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-sm">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {artist.location?.city || "Unknown"}
                    </div>
                    <div className="text-[10px] text-text3 ml-5">{artist.location?.state || "India"}</div>
                  </td>
                  <td>
                    <div className="flex gap-3">
                      <div title="Images" className={`flex items-center gap-1 text-sm ${!artist.media?.images?.length ? 'text-crimson' : 'text-text2'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        <span className="font-bold">{artist.media?.images?.length || 0}</span>
                      </div>
                      <div title="Videos" className={`flex items-center gap-1 text-sm ${!artist.media?.videos?.length ? 'text-crimson' : 'text-text2'}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/></svg>
                        <span className="font-bold">{artist.media?.videos?.length || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/artists/${artist._id}/edit`} className="admin-action-btn" title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </Link>
                      <button onClick={() => handleDelete(artist._id)} className="admin-action-btn delete" title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap" style={{ marginTop: "1.5rem" }}>
            <button onClick={() => setPage(1)} disabled={page === 1}
              className="btn-outline" style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
            </button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-outline" style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>

            <div className="flex items-center gap-1 sm:gap-1.5" style={{ display: "flex", alignItems: "center" }}>
              {(() => {
                const pages: (number | "...")[] = [];
                const range = 2;
                pages.push(1);
                if (page - range > 2) pages.push("...");
                for (let i = Math.max(2, page - range); i <= Math.min(totalPages - 1, page + range); i++) {
                  pages.push(i);
                }
                if (page + range < totalPages - 1) pages.push("...");
                if (totalPages > 1) pages.push(totalPages);
                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="hidden sm:inline" style={{ padding: "0.35rem 0.3rem", fontSize: "0.8rem", color: "var(--text3)" }}>...</span>
                  ) : (
                    <button key={p} onClick={() => setPage(p)}
                      className="hidden sm:inline-flex"
                      style={{
                        padding: "0.35rem 0.6rem", fontSize: "0.82rem", borderRadius: "6px", cursor: "pointer",
                        border: `1px solid ${p === page ? "var(--gold)" : "var(--border)"}`,
                        background: p === page ? "var(--gold)" : "transparent",
                        color: p === page ? "#000" : "var(--text)",
                        fontWeight: p === page ? 800 : 500,
                        minWidth: "30px",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {p}
                    </button>
                  )
                );
              })()}

              <span className="sm:hidden text-xs" style={{ color: "var(--text2)", padding: "0 0.3rem", whiteSpace: "nowrap" }}>
                {page} / {totalPages}
              </span>
            </div>

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-outline" style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages}
              className="btn-outline" style={{ padding: "0.35rem 0.5rem", fontSize: "0.8rem", opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </button>

            <form onSubmit={(e) => { e.preventDefault(); const p = parseInt(gotoPage); if (p >= 1 && p <= totalPages) { setPage(p); setGotoPage(""); } }} className="flex items-center gap-1" style={{ marginLeft: "0.5rem" }}>
              <input type="number" min={1} max={totalPages} value={gotoPage} onChange={(e) => setGotoPage(e.target.value)} placeholder="Page"
                style={{ width: "52px", padding: "0.35rem 0.4rem", fontSize: "0.8rem", borderRadius: "6px", background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)", textAlign: "center" }} />
              <button type="submit"
                className="btn-outline" style={{ padding: "0.35rem 0.5rem", fontSize: "0.78rem", cursor: "pointer" }}>Go</button>
            </form>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
        variant="danger"
      />
      <BulkDeleteOtpModal
        isOpen={otpModal}
        count={pendingBulkDeleteIds.length}
        resource="artists"
        onVerified={executeBulkDelete}
        onCancel={() => { setOtpModal(false); setPendingBulkDeleteIds([]); }}
      />
    </div>
  );
}
