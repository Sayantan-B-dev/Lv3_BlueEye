"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const YT_REGEX = /(?:v\/|v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/;

interface LinkField {
  id: string;
  url: string;
  status: "idle" | "validating" | "valid" | "invalid";
  error?: string;
}

const createField = (url = ""): LinkField => ({
  id: crypto.randomUUID(),
  url,
  status: url ? "validating" : "idle",
});

export default function MissingMediaPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [artists, setArtists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("images");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedArtist, setSelectedArtist] = useState<any | null>(null);
  const [imageFields, setImageFields] = useState<LinkField[]>([]);
  const [videoFields, setVideoFields] = useState<LinkField[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshKey, setRefreshKey] = useState(0);
  const [failedVideoIds, setFailedVideoIds] = useState<Set<string>>(new Set());
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [previewSrcs, setPreviewSrcs] = useState<Record<string, string>>({});

  const imageFieldsRef = useRef(imageFields);
  const videoFieldsRef = useRef(videoFields);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => { imageFieldsRef.current = imageFields; }, [imageFields]);
  useEffect(() => { videoFieldsRef.current = videoFields; }, [videoFields]);

  useEffect(() => {
    const ids = new Set<string>();
    for (const f of imageFields) {
      if (f.status === "valid" && f.url.startsWith("http") && !previewSrcs[f.id]) ids.add(f.id);
    }
    if (ids.size === 0) return;
    let cancelled = false;
    (async () => {
      for (const id of ids) {
        const field = imageFields.find(f => f.id === id);
        if (!field) continue;
        try {
          const res = await fetch(`/api/admin/upload-proxy?url=${encodeURIComponent(field.url)}`);
          const data = await res.json();
          if (!cancelled && data.success) setPreviewSrcs(prev => ({ ...prev, [id]: data.blobUrl }));
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageFields]);

  const hasImages = (selectedArtist?.media?.images?.length ?? 0) > 0;
  const hasVideos = (selectedArtist?.media?.videos?.length ?? 0) > 0;
  const needsImages = !hasImages;
  const needsVideos = !hasVideos;
  const existingImageCount = selectedArtist?.media?.images?.length ?? 0;
  const existingVideoCount = selectedArtist?.media?.videos?.length ?? 0;

  const hasAnyLinks = imageFields.some(f => f.url.trim()) || videoFields.some(f => f.url.trim());
  const allValid = [...imageFields, ...videoFields]
    .filter(f => f.url.trim())
    .every(f => f.status === "valid");

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
    const needsImgs = !((artist?.media?.images?.length ?? 0) > 0);
    const needsVids = !((artist?.media?.videos?.length ?? 0) > 0);
    setImageFields(needsImgs ? [createField()] : []);
    setVideoFields(needsVids ? [createField()] : []);
    setMessage(null);
  };

  const imageSectionRef = useRef<HTMLDivElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedArtist) return;
    const timer = setTimeout(() => {
      if (imageFields.length > 0 && imageSectionRef.current) {
        imageSectionRef.current.querySelector("input")?.focus();
      } else if (videoFields.length > 0 && videoSectionRef.current) {
        videoSectionRef.current.querySelector("input")?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArtist]);

  const setFieldStatus = useCallback((
    fields: LinkField[],
    setter: React.Dispatch<React.SetStateAction<LinkField[]>>,
    fieldId: string,
    status: LinkField["status"],
    error?: string,
  ) => {
    setter(prev => prev.map(f => f.id === fieldId ? { ...f, status, error } : f));
  }, []);

  const validateUrl = useCallback(async (fieldId: string, url: string, isVideo: boolean) => {
    const setter = isVideo ? setVideoFields : setImageFields;
    const ref = isVideo ? videoFieldsRef : imageFieldsRef;

    setFieldStatus(ref.current, setter, fieldId, "validating");

    try {
      const res = await fetch("/api/admin/validate-media-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, isVideo }),
      });

      if (!res.ok && res.status >= 500) {
        setFieldStatus(ref.current, setter, fieldId, "invalid", "Server error, please try again");
        return;
      }

      const currentFields = ref.current;
      const currentField = currentFields.find(f => f.id === fieldId);
      if (currentField?.url.trim() !== url) return;

      const data = await res.json();
      setFieldStatus(ref.current, setter, fieldId, data.success ? "valid" : "invalid", data.error);
    } catch {
      const currentFields = ref.current;
      const currentField = currentFields.find(f => f.id === fieldId);
      if (currentField?.url.trim() !== url) return;
      setFieldStatus(ref.current, setter, fieldId, "invalid", "Network error during validation");
    }
  }, [setFieldStatus]);

  const scheduleValidation = useCallback((fieldId: string, url: string, isVideo: boolean, delay = 700) => {
    if (debounceTimers.current[fieldId]) clearTimeout(debounceTimers.current[fieldId]);
    if (!url.startsWith("http")) return;

    debounceTimers.current[fieldId] = setTimeout(() => {
      const ref = isVideo ? videoFieldsRef : imageFieldsRef;
      const field = ref.current.find(f => f.id === fieldId);
      if (field && field.status === "idle" && field.url.trim().startsWith("http")) {
        validateUrl(fieldId, field.url.trim(), isVideo);
      }
    }, delay);
  }, [validateUrl]);

  const addImageField = () => setImageFields(prev => [...prev, createField()]);
  const addVideoField = () => setVideoFields(prev => [...prev, createField()]);

  const handleImageChange = (id: string, value: string) => {
    setImageFields(prev => prev.map(f => f.id === id ? { ...f, url: value, status: "idle", error: undefined } : f));
    scheduleValidation(id, value.trim(), false);
  };

  const handleVideoChange = (id: string, value: string) => {
    setVideoFields(prev => prev.map(f => f.id === id ? { ...f, url: value, status: "idle", error: undefined } : f));
    scheduleValidation(id, value.trim(), true);
  };

  const handleImagePaste = (id: string) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
    setTimeout(() => {
      const field = imageFieldsRef.current.find(f => f.id === id);
      if (field && field.url.trim().startsWith("http") && field.status === "idle") {
        validateUrl(id, field.url.trim(), false);
      }
    }, 0);
  };

  const handleVideoPaste = (id: string) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
    setTimeout(() => {
      const field = videoFieldsRef.current.find(f => f.id === id);
      if (field && field.url.trim().startsWith("http") && field.status === "idle") {
        validateUrl(id, field.url.trim(), true);
      }
    }, 0);
  };

  const handleImageBlur = (id: string) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
    const field = imageFieldsRef.current.find(f => f.id === id);
    if (field?.url.trim().startsWith("http") && field.status === "idle") {
      validateUrl(id, field.url.trim(), false);
    }
  };

  const handleVideoBlur = (id: string) => {
    if (debounceTimers.current[id]) {
      clearTimeout(debounceTimers.current[id]);
      delete debounceTimers.current[id];
    }
    const field = videoFieldsRef.current.find(f => f.id === id);
    if (field?.url.trim().startsWith("http") && field.status === "idle") {
      validateUrl(id, field.url.trim(), true);
    }
  };

  const handleSubmit = async () => {
    if (!selectedArtist) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const safeSegment = (s: string) => s.replace(/[^a-zA-Z0-9_\-\s]/g, "").replace(/\s+/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "") || "unknown";
      const folder = `${safeSegment(selectedArtist.category || "misc")}/${safeSegment(selectedArtist.name).toLowerCase()}`;

      const validImageUrls = imageFields.filter(f => f.status === "valid").map(f => f.url.trim());
      const validVideoUrls = videoFields.filter(f => f.status === "valid").map(f => f.url.trim());

      const promises: Promise<Response>[] = [];

      for (const url of validImageUrls) {
        promises.push(
          fetch("/api/admin/upload-from-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, folder, artistId: selectedArtist._id, isVideo: false }),
          })
        );
      }

      for (const url of validVideoUrls) {
        promises.push(
          fetch("/api/admin/upload-from-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url, folder: "", artistId: selectedArtist._id, isVideo: true }),
          })
        );
      }

      if (promises.length === 0) {
        setSubmitting(false);
        return;
      }

      const results = await Promise.all(promises);
      const allOk = results.every(r => r.ok);

      if (!allOk) {
        const errors = await Promise.all(results.map(r => r.json().catch(() => ({ error: "Unknown error" }))));
        throw new Error(errors.map(e => e.error).join("; "));
      }

      const bodies = await Promise.all(results.map(r => r.json()));
      const newImages: string[] = [];
      const newVideos: string[] = [];

      for (let i = 0; i < validImageUrls.length; i++) {
        const body = bodies[i];
        if (body.filePath) newImages.push(body.filePath);
      }
      for (let i = 0; i < validVideoUrls.length; i++) {
        newVideos.push(validVideoUrls[i]);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSelectedArtist((prev: any) => prev ? {
        ...prev,
        media: {
          images: [...(prev.media?.images || []), ...newImages],
          videos: [...(prev.media?.videos || []), ...newVideos],
        },
      } : prev);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setArtists((prev: any[]) => prev.map(a => a._id === selectedArtist._id ? {
        ...a,
        media: {
          images: [...(a.media?.images || []), ...newImages],
          videos: [...(a.media?.videos || []), ...newVideos],
        },
      } : a));

      setMessage({ type: "success", text: `Added ${newImages.length} image${newImages.length !== 1 ? "s" : ""}${newVideos.length ? ` and ${newVideos.length} video${newVideos.length !== 1 ? "s" : ""}` : ""} successfully!` });
      setImageFields([]);
      setVideoFields([]);
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

  const renderField = (field: LinkField, isVideo: boolean) => {
    const videoId = isVideo ? field.url.match(YT_REGEX)?.[1] : null;
    const isFocused = focusedFieldId === field.id;

    return (
      <div key={field.id} className="mm-field-wrapper">
        <input
          type="text"
          placeholder={isVideo ? "https://youtube.com/watch?v=..." : "https://example.com/image.jpg"}
          value={field.url}
          onChange={(e) => (isVideo ? handleVideoChange : handleImageChange)(field.id, e.target.value)}
          onPaste={() => (isVideo ? handleVideoPaste : handleImagePaste)(field.id)}
          onBlur={() => {
            (isVideo ? handleVideoBlur : handleImageBlur)(field.id);
            setFocusedFieldId(null);
          }}
          onFocus={() => setFocusedFieldId(field.id)}
          className={`mm-input${field.status === "valid" ? " is-valid" : field.status === "invalid" ? " is-invalid" : field.status === "validating" ? " is-validating" : ""}${isFocused && field.status === "idle" ? " is-focused" : ""}`}
        />
        {field.status === "invalid" && field.error && (
          <div className="mm-error">
            {field.error.length > 120 ? field.error.slice(0, 120) + "..." : field.error}
          </div>
        )}
        {field.status === "valid" && (
          <div className="mm-preview-row">
            {!isVideo && field.url.startsWith("http") && (
              <div className="mm-preview-image">
                {previewSrcs[field.id] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={previewSrcs[field.id]} alt="" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                )}
              </div>
            )}
            {isVideo && videoId && (
              <div className="mm-preview-video">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" />
                <div className="mm-preview-video-badge">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const countNonEmptyValidating = [...imageFields, ...videoFields]
    .filter(f => f.url.trim() && f.status === "validating").length;

  const canSubmit = !submitting && hasAnyLinks && allValid && countNonEmptyValidating === 0;

  return (
    <div className="fade-in">
      <div className="admin-header">
        <h1 className="admin-title">
          Missing <span className="text-gold">Media</span>
        </h1>
        <p className="admin-subtitle">Find artists missing images or videos and add media quickly.</p>
      </div>

      <div className="admin-table-container">
        <div className="flex gap-3 flex-wrap mm-header-row">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setSelectedArtist(null); }}
            className="mm-select mm-select--filter"
          >
            <option value="images">Missing Only Image</option>
            <option value="videos">Missing Only Video</option>
            <option value="both">Missing Both</option>
          </select>

          <select
            value={selectedArtist?._id || ""}
            onChange={(e) => handleArtistSelect(e.target.value)}
            className="mm-select mm-select--artist"
          >
            <option value="">Select an artist...</option>
            {artists.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.category})
              </option>
            ))}
          </select>

          {loading && <span className="mm-loading-text">Loading...</span>}
          <span className="mm-count-text">
            {artists.length} artist{artists.length !== 1 ? "s" : ""}
          </span>
        </div>

        {selectedArtist && (
          <div className="mm-artist-card">
            <div className="flex items-center gap-3 flex-wrap mm-card-header">
              <div>
                <span className="mm-artist-name">{selectedArtist.name}</span>
                <span className="admin-badge mm-category-badge">{selectedArtist.category}</span>
              </div>
              <div className="flex gap-2 mm-actions-group">
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mm-action-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                  YouTube
                </a>
                <a
                  href={googleSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline mm-action-link"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  Google Images
                </a>
              </div>
            </div>

            <div className="mm-grid">
              <div ref={imageSectionRef}>
                <label className="admin-field-label mm-label">
                  Paste Image Links
                  {selectedArtist && (
                    needsImages
                      ? <span className="admin-badge mm-badge-missing">Missing</span>
                      : <span className="admin-badge mm-badge-present">{existingImageCount} image{existingImageCount !== 1 ? "s" : ""}</span>
                  )}
                </label>

                {imageFields.length === 0 && (
                  <div className="mm-empty-text">
                    No image links added yet.
                  </div>
                )}

                {imageFields.map(field => renderField(field, false))}

                <button
                  onClick={addImageField}
                  className="mm-add-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Image Link
                </button>
              </div>

              <div ref={videoSectionRef}>
                <label className="admin-field-label mm-label">
                  Paste YouTube Links
                  {selectedArtist && (
                    needsVideos
                      ? <span className="admin-badge mm-badge-missing">Missing</span>
                      : <span className="admin-badge mm-badge-present">{existingVideoCount} video{existingVideoCount !== 1 ? "s" : ""}</span>
                  )}
                </label>

                {videoFields.length === 0 && (
                  <div className="mm-empty-text">
                    No video links added yet.
                  </div>
                )}

                {videoFields.map(field => renderField(field, true))}

                <button
                  onClick={addVideoField}
                  className="mm-add-btn"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add YouTube Link
                </button>
              </div>
            </div>

            {/* Existing media summary */}
            {(existingImageCount > 0 || existingVideoCount > 0) && (
              <div className="mm-existing">
                <div className="mm-existing-title">Existing Media</div>
                <div className="mm-existing-grid">
                  {selectedArtist?.media?.images?.slice(0, 5).map((img: string, i: number) => {
                    const imgSrc = img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${img.startsWith("/") ? img.slice(1) : img}`;
                    return (
                      <div key={i} className="mm-existing-thumb">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imgSrc} alt="" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      </div>
                    );
                  })}
                  {selectedArtist?.media?.videos?.slice(0, 3).map((vid: string, i: number) => {
                    const id = vid.match(YT_REGEX)?.[1];
                    const failed = id ? failedVideoIds.has(id) : true;
                    return id ? (
                      <div key={i} className="mm-existing-video-thumb">
                        {failed ? (
                          <a
                            href={`https://youtube.com/watch?v=${id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mm-existing-video-link"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                            See on YouTube
                          </a>
                        ) : (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" onError={() => setFailedVideoIds(prev => new Set(prev).add(id))} />
                            <div className="mm-existing-video-badge">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
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
              <div className={`mm-message ${message.type === "success" ? "is-success" : "is-error"}`}>
                {message.text}
              </div>
            )}

            <div className="mm-actions">
              {hasAnyLinks && !allValid && (
                <span className="mm-validate-note">
                  {countNonEmptyValidating > 0
                    ? "Validating links..."
                    : "Some links are invalid — fix them before saving."}
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary mm-submit-btn"
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
