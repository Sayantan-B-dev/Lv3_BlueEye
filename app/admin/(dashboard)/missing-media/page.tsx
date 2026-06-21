"use client";

import { useEffect, useRef, useState } from "react";

const YT_REGEX = /(?:v\/|v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/;

export default function MissingMediaPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("images");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [imageLinksText, setImageLinksText] = useState("");
  const [videoLinksText, setVideoLinksText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [imagePreviewFailed, setImagePreviewFailed] = useState(false);
  const [failedVideoIds, setFailedVideoIds] = useState<Set<string>>(new Set());
  const imageRef = useRef<HTMLTextAreaElement>(null);
  const videoRef = useRef<HTMLTextAreaElement>(null);

  const imageLinks = imageLinksText.split("\n").map(s => s.trim()).filter(Boolean);
  const videoLinks = videoLinksText.split("\n").map(s => s.trim()).filter(Boolean);

  const hasImages = (selectedArtist?.media?.images?.length ?? 0) > 0;
  const hasVideos = (selectedArtist?.media?.videos?.length ?? 0) > 0;
  const needsImages = !hasImages;
  const needsVideos = !hasVideos;
  const existingImageCount = selectedArtist?.media?.images?.length ?? 0;
  const existingVideoCount = selectedArtist?.media?.videos?.length ?? 0;

  useEffect(() => {
    let cancelled = false;
    const doFetch = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/artists/missing?type=${filterType}`);
        const data = await res.json();
        if (!cancelled && data.success) setArtists(data.data);
      } catch {
        if (!cancelled) console.error("Failed to fetch artists");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [filterType, refreshKey]);

  const handleArtistSelect = (id: string) => {
    const artist = artists.find((a) => a._id === id);
    setSelectedArtist(artist || null);
    setImageLinksText("");
    setVideoLinksText("");
    setMessage(null);
  };

  // Auto-focus the missing-media field when artist changes
  useEffect(() => {
    if (!selectedArtist) return;
    const timer = setTimeout(() => {
      if (needsImages && imageRef.current) imageRef.current.focus();
      else if (needsVideos && videoRef.current) videoRef.current.focus();
    }, 100);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtist]);

  const imagePreviews = imageLinks.filter(u => u.startsWith("http") || u.startsWith("data:image"));
  const videoPreviews = videoLinks.map(u => ({ url: u, id: u.match(YT_REGEX)?.[1] })).filter(v => v.id);

  useEffect(() => { setPreviewFailed(false); }, [videoLinksText]);
  useEffect(() => { setImagePreviewFailed(false); }, [imageLinksText]);

  const handleSubmit = async () => {
    if (!selectedArtist) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const safeSegment = (s: string) => s.replace(/[^a-zA-Z0-9_\-\s]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "unknown";
      const folder = `${safeSegment(selectedArtist.category || "misc")}/${safeSegment(selectedArtist.name).toLowerCase()}`;

      const promises: Promise<Response>[] = [];

      for (const url of imageLinks) {
        promises.push(
          fetch("/api/admin/upload-from-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              folder,
              artistId: selectedArtist._id,
              isVideo: false,
            }),
          })
        );
      }

      for (const url of videoLinks) {
        promises.push(
          fetch("/api/admin/upload-from-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url,
              folder: "",
              artistId: selectedArtist._id,
              isVideo: true,
            }),
          })
        );
      }

      if (promises.length === 0) {
        setSubmitting(false);
        return;
      }

      const results = await Promise.all(promises);
      const allOk = results.every((r) => r.ok);

      if (!allOk) {
        const errors = await Promise.all(results.map((r) => r.json().catch(() => ({ error: "Unknown error" }))));
        throw new Error(errors.map((e) => e.error).join("; "));
      }

      setMessage({ type: "success", text: `Added ${imageLinks.length} image${imageLinks.length !== 1 ? "s" : ""}${videoLinks.length ? ` and ${videoLinks.length} video${videoLinks.length !== 1 ? "s" : ""}` : ""} successfully!` });
      setImageLinksText("");
      setVideoLinksText("");
      setRefreshKey(k => k + 1);
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Something went wrong" });
    } finally {
      setSubmitting(false);
    }
  };

  const googleSearchUrl = selectedArtist
    ? `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${selectedArtist.name},${selectedArtist.category}`)}`
    : "#";

  const youtubeSearchUrl = selectedArtist
    ? `https://www.youtube.com/results?search_query=${encodeURIComponent(`${selectedArtist.name} ${selectedArtist.category}`)}`
    : "#";

  return (
    <div className="fade-in">
      <div className="admin-header">
        <h1 className="admin-title">
          Missing <span className="text-gold">Media</span>
        </h1>
        <p className="admin-subtitle">Find artists missing images or videos and add media quickly.</p>
      </div>

      <div className="admin-table-container" style={{ maxWidth: "100%" }}>
        <div className="flex gap-3 flex-wrap" style={{ marginBottom: "1.5rem", alignItems: "center" }}>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setSelectedArtist(null); }}
            style={{
              padding: "0.6rem 0.8rem", borderRadius: "12px", background: "var(--bg)",
              border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.85rem",
              flex: "0 0 auto", minWidth: "160px",
            }}
          >
            <option value="images">Missing Only Image</option>
            <option value="videos">Missing Only Video</option>
            <option value="both">Missing Both</option>
          </select>

          <select
            value={selectedArtist?._id || ""}
            onChange={(e) => handleArtistSelect(e.target.value)}
            style={{
              flex: "1 1 250px", padding: "0.6rem 0.8rem", borderRadius: "12px", background: "var(--bg)",
              border: "1px solid var(--border)", color: "var(--text)", fontSize: "0.85rem",
              minWidth: "200px",
            }}
          >
            <option value="">Select an artist...</option>
            {artists.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.category})
              </option>
            ))}
          </select>

          {loading && <span style={{ color: "var(--text3)", fontSize: "0.85rem" }}>Loading...</span>}
          <span style={{ color: "var(--text3)", fontSize: "0.82rem", whiteSpace: "nowrap" }}>
            {artists.length} artist{artists.length !== 1 ? "s" : ""}
          </span>
        </div>

        {selectedArtist && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px",
            padding: "1.5rem", marginTop: "0.5rem",
          }}>
            <div className="flex items-center gap-3 flex-wrap" style={{ marginBottom: "1.5rem" }}>
              <div>
                <span style={{ fontSize: "1.1rem", fontWeight: 700 }}>{selectedArtist.name}</span>
                <span className="admin-badge" style={{ marginLeft: "0.75rem" }}>{selectedArtist.category}</span>
              </div>
              <div className="flex gap-2" style={{ marginLeft: "auto" }}>
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                  YouTube
                </a>
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "0.4rem", textDecoration: "none" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Google Images
                </a>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div>
                <label className="admin-field-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Paste Image Links
                  {selectedArtist && (
                    needsImages
                      ? <span className="admin-badge" style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>Missing</span>
                      : <span className="admin-badge" style={{ background: "rgba(0,200,80,0.12)", color: "#00c850", fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>{existingImageCount} image{existingImageCount !== 1 ? "s" : ""}</span>
                  )}
                </label>
                <textarea
                  ref={imageRef}
                  className="admin-input-base"
                  rows={4}
                  placeholder="Paste image URLs, one per line&#10;e.g. https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                  value={imageLinksText}
                  onChange={(e) => setImageLinksText(e.target.value)}
                  style={{ ...needsImages ? {} : { opacity: 0.6 }, resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }}
                />
                {imagePreviews.length > 0 && !imagePreviewFailed && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {imagePreviews.slice(0, 6).map((url, i) => (
                      <div key={i} style={{ width: "80px", height: "80px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg3)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    ))}
                    {imagePreviews.length > 6 && <span style={{ fontSize: "0.75rem", color: "var(--text3)", alignSelf: "center" }}>+{imagePreviews.length - 6} more</span>}
                  </div>
                )}
                {imagePreviews.length > 0 && imagePreviewFailed && (
                  <div style={{ marginTop: "0.75rem", borderRadius: "12px", border: "1px solid var(--border)", padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", background: "var(--bg)", color: "var(--text3)", fontSize: "0.8rem" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                    Some previews failed to load
                  </div>
                )}
              </div>

              <div>
                <label className="admin-field-label" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  Paste YouTube Links
                  {selectedArtist && (
                    needsVideos
                      ? <span className="admin-badge" style={{ background: "rgba(255,71,87,0.15)", color: "#ff4757", fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>Missing</span>
                      : <span className="admin-badge" style={{ background: "rgba(0,200,80,0.12)", color: "#00c850", fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>{existingVideoCount} video{existingVideoCount !== 1 ? "s" : ""}</span>
                  )}
                </label>
                <textarea
                  ref={videoRef}
                  className="admin-input-base"
                  rows={4}
                  placeholder="Paste YouTube URLs, one per line&#10;e.g. https://youtube.com/watch?v=xxx&#10;https://youtu.be/xxx"
                  value={videoLinksText}
                  onChange={(e) => setVideoLinksText(e.target.value)}
                  style={{ ...needsVideos ? {} : { opacity: 0.6 }, resize: "vertical", fontFamily: "monospace", fontSize: "0.8rem" }}
                />
                {videoPreviews.length > 0 && !previewFailed && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {videoPreviews.slice(0, 6).map((v, i) => (
                      <div key={i} style={{ width: "96px", height: "72px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg3)", position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`https://img.youtube.com/vi/${v.id}/mqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setPreviewFailed(true)} />
                        <div style={{ position: "absolute", bottom: "3px", right: "3px", background: "#ff0000", borderRadius: "3px", padding: "1px 4px" }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                        </div>
                      </div>
                    ))}
                    {videoPreviews.slice(6).map((v, i) => (
                      <a key={i + 6} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" style={{ width: "96px", height: "72px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.2rem", color: "var(--text2)", textDecoration: "none", fontSize: "0.6rem", background: "var(--bg)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                        See on YouTube
                      </a>
                    ))}
                  </div>
                )}
                {videoPreviews.length > 0 && previewFailed && (
                  <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {videoPreviews.map((v, i) => (
                      <a key={i} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer" style={{ width: "96px", height: "72px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.2rem", color: "var(--text2)", textDecoration: "none", fontSize: "0.6rem", background: "var(--bg)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                        See on YouTube
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Existing media summary */}
            {(existingImageCount > 0 || existingVideoCount > 0) && (
              <div style={{
                marginTop: "1rem", padding: "1rem", borderRadius: "12px",
                background: "var(--bg)", border: "1px solid var(--border)",
              }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text3)", marginBottom: "0.75rem" }}>Existing Media</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                  {selectedArtist?.media?.images?.slice(0, 5).map((img: string, i: number) => {
                    const imgSrc = img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${img.startsWith("/") ? img.slice(1) : img}`;
                    return (
                      <div key={i} style={{ width: "72px", height: "72px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg3)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    );
                  })}
                  {selectedArtist?.media?.videos?.slice(0, 3).map((vid: string, i: number) => {
                    const id = vid.match(YT_REGEX)?.[1];
                    const failed = id ? failedVideoIds.has(id) : true;
                    return id ? (
                      <div key={i} style={{ width: "96px", height: "72px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", background: "var(--bg3)", position: "relative" }}>
                        {failed ? (
                          <a
                            href={`https://youtube.com/watch?v=${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", color: "var(--text2)", textDecoration: "none", fontSize: "0.6rem", lineHeight: 1.2 }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            See on YouTube
                          </a>
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={() => setFailedVideoIds(prev => new Set(prev).add(id))} />
                            <div style={{ position: "absolute", bottom: "3px", right: "3px", background: "#ff0000", borderRadius: "3px", padding: "1px 4px" }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                            </div>
                          </>
                        )}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {message && (
              <div style={{
                marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.85rem",
                background: message.type === "success" ? "rgba(0,200,80,0.1)" : "rgba(255,71,87,0.1)",
                color: message.type === "success" ? "#00c850" : "#ff4757",
                border: `1px solid ${message.type === "success" ? "rgba(0,200,80,0.2)" : "rgba(255,71,87,0.2)"}`,
              }}>
                {message.text}
              </div>
            )}

            <div style={{ marginTop: "1.5rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button
                onClick={handleSubmit}
                disabled={submitting || (imageLinks.length === 0 && videoLinks.length === 0)}
                className="btn-primary"
                style={{ padding: "0.7rem 2rem", borderRadius: "12px", opacity: (imageLinks.length === 0 && videoLinks.length === 0) ? 0.5 : 1, cursor: (imageLinks.length === 0 && videoLinks.length === 0) ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Uploading..." : "Save Media"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
