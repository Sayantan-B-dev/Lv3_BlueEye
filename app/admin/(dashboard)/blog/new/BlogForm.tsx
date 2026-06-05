"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function BlogForm({ mode, initialData }: { mode: "create" | "edit"; initialData?: any }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initialData?.title || "",
    excerpt: initialData?.excerpt || "",
    content: initialData?.content || "",
    coverImage: initialData?.coverImage || "",
    category: initialData?.category || "",
    tags: initialData?.tags?.join(", ") || "",
    author: initialData?.author || "Blue Eye Entertainment Team",
    published: initialData?.published ?? true,
    featured: initialData?.featured || false,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const postSlug = form.title
        ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "post";
      const extension = file.name.split(".").pop() || "jpg";
      const newFileName = `${postSlug}-${Date.now()}.${extension}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      const data = new FormData();
      data.append("file", renamedFile);
      data.append("folder", `/blog/${postSlug}`);

      const res = await fetch("/api/admin/upload", { method: "POST", body: data });
      const result = await res.json();
      if (result.success) {
        const fullUrl = result.url.startsWith("http")
          ? result.url
          : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${result.filePath}`;
        set("coverImage", fullUrl);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      ...form,
      tags: form.tags.split(",").map((t: string) => t.trim()).filter(Boolean),
    };

    const url = mode === "create"
      ? "/api/admin/blog"
      : `/api/admin/blog/${initialData._id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/admin/blog");
        router.refresh();
      } else {
        setError(data.message || "Failed to save post");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-form-main-card">
      <form onSubmit={handleSubmit} className="w-full">
        {error && (
          <p className="p-4 mb-6 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-sm">
            {error}
          </p>
        )}

        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Article Details
          </h3>

          <div className="admin-field-group">
            <label className="admin-field-label">Title *</label>
            <input
              type="text"
              required
              className="admin-input-base"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="How to Book a Singer for Your Wedding in India"
            />
          </div>

          <div className="admin-field-row mt-6">
            <div className="admin-field-group">
              <label className="admin-field-label">Category</label>
              <input
                type="text"
                className="admin-input-base"
                value={form.category}
                onChange={e => set("category", e.target.value)}
                placeholder="e.g. Wedding Guide, Artist Spotlight"
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Author</label>
              <input
                type="text"
                className="admin-input-base"
                value={form.author}
                onChange={e => set("author", e.target.value)}
              />
            </div>
          </div>

          <div className="admin-field-group mt-6">
            <label className="admin-field-label">Excerpt</label>
            <input
              type="text"
              className="admin-input-base"
              value={form.excerpt}
              onChange={e => set("excerpt", e.target.value)}
              placeholder="Brief summary (150-200 chars) for search results and blog cards..."
            />
          </div>
        </div>

        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Content
          </h3>

          <div className="admin-field-group">
            <label className="admin-field-label">Article Body * (HTML supported)</label>
            <textarea
              className="admin-input-base admin-textarea"
              style={{ minHeight: "300px", fontFamily: "monospace", fontSize: "0.88rem" }}
              value={form.content}
              onChange={e => set("content", e.target.value)}
              placeholder="<h2>Introduction</h2><p>Your article content here...</p>"
              required
            />
          </div>
        </div>

        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            Media & Metadata
          </h3>

          <div className="admin-field-group">
            <label className="admin-field-label mb-4">Cover Image (ImageKit Uploader)</label>
            <div className="flex gap-4 items-center flex-wrap">
              {form.coverImage ? (
                <div className="admin-upload-item" style={{ width: 150, height: 150, position: "relative" }}>
                  <img src={form.coverImage} alt="Cover Preview" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "16px" }} />
                  <div onClick={() => set("coverImage", "")} className="admin-upload-delete" style={{ borderRadius: "16px", cursor: "pointer" }}>
                    Remove Cover
                  </div>
                </div>
              ) : (
                <label className="admin-upload-btn" style={{ width: 150, height: 150, padding: "1.25rem", boxSizing: "border-box", margin: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  {uploading ? (
                    <span className="animate-spin text-xl">⏳</span>
                  ) : (
                    <>
                      <span className="text-3xl">+</span>
                      <span className="text-[10px] mt-2 uppercase font-black tracking-widest text-center">Upload Cover Image</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          <div className="admin-field-group" style={{ marginTop: "1.5rem" }}>
            <label className="admin-field-label">Tags (comma-separated)</label>
            <input
              type="text"
              className="admin-input-base"
              value={form.tags}
              onChange={e => set("tags", e.target.value)}
              placeholder="wedding, singer, booking, guide"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "2.5rem", marginTop: "2.5rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => set("published", !form.published)}>
            <div className={`admin-checkbox ${form.published ? "checked" : ""}`} style={{ flexShrink: 0 }}>
              {form.published && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className="font-bold text-text text-sm">Publish immediately</span>
          </div>

          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => set("featured", !form.featured)}>
            <div className={`admin-checkbox ${form.featured ? "checked" : ""}`} style={{ flexShrink: 0 }}>
              {form.featured && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className="font-bold text-text text-sm">Feature on Landing Page</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1.5rem", paddingTop: "2rem", marginTop: "3.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button type="button" onClick={() => router.push("/admin/blog")} className="btn-outline px-10 py-3 rounded-xl text-sm">
            Discard Changes
          </button>
          <button type="submit" disabled={saving || uploading} className="btn-primary px-14 py-3 rounded-xl text-sm font-bold shadow-gold/20">
            {saving ? "Saving Post..." : mode === "create" ? "Create Post" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
