"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

type EventFormProps = {
  initial?: any;
  mode: "create" | "edit";
  eventId?: string;
};

export default function EventForm({ initial, mode, eventId }: EventFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title || "",
    category: initial?.category || "Concert",
    shortDescription: initial?.shortDescription || "",
    description: initial?.description || "",
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 16) : "",
    endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 16) : "",
    coverImage: initial?.coverImage || "",
    status: initial?.status || "Upcoming",
    featured: initial?.featured || false,
    capacity: initial?.capacity ?? 0,
    registrationOpen: initial?.registrationOpen ?? true,
    tags: initial?.tags?.join(", ") || "",
    venueName: initial?.venue?.name || "",
    venueCity: initial?.venue?.city || "",
    venueState: initial?.venue?.state || "",
    venueAddress: initial?.venue?.address || "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "danger" | "warning" | "info" | "success";
    showCancel?: boolean;
    confirmText?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    variant: "success",
    showCancel: false,
    confirmText: "OK",
  });

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const eventSlug = form.title
        ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
        : "event";
      const extension = file.name.split(".").pop() || "jpg";
      const newFileName = `${eventSlug}-${Date.now()}.${extension}`;
      const renamedFile = new File([file], newFileName, { type: file.type });

      const data = new FormData();
      data.append("file", renamedFile);
      data.append("folder", `/events/${eventSlug}`);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        category: form.category,
        shortDescription: form.shortDescription,
        description: form.description,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        coverImage: form.coverImage || undefined,
        status: form.status,
        featured: form.featured,
        capacity: Number(form.capacity),
        registrationOpen: form.registrationOpen,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        venue: {
          name: form.venueName,
          city: form.venueCity,
          state: form.venueState,
          address: form.venueAddress,
        },
      };
      const url = mode === "edit" ? `/api/admin/events/${eventId}` : "/api/admin/events";
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      
      setModal({
        isOpen: true,
        title: mode === "edit" ? "Event Updated" : "Event Created",
        message: mode === "edit" ? "The event has been successfully updated." : "The new event has been successfully created.",
        variant: "success",
        showCancel: false,
        confirmText: "Awesome",
        onConfirm: () => {
          router.push("/admin/events");
          router.refresh();
        },
      });
    } catch (err: any) {
      setError(err.message);
      setModal({
        isOpen: true,
        title: "Save Failed",
        message: err.message || "Failed to save the event details.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-form-main-card">
      <form onSubmit={handleSubmit} className="w-full">
      {error && (
        <p className="p-4 mb-6 rounded-xl bg-crimson/10 border border-crimson/20 text-crimson text-sm">
          {error}
        </p>
      )}

      {/* Section 1: Event Information */}
      <div className="admin-form-row-section">
        <h3 className="admin-form-row-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          Event Specifications
        </h3>

        <div className="admin-field-row">
          <div className="admin-field-group">
            <label className="admin-field-label">Event Title *</label>
            <input
              type="text"
              required
              className="admin-input-base"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="e.g. BlueEye Electro Night"
            />
          </div>
          <div className="admin-field-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="admin-field-group">
              <label className="admin-field-label">Category *</label>
              <select
                className="admin-input-base"
                value={form.category}
                onChange={e => set("category", e.target.value)}
                style={{ paddingRight: "2.5rem" }}
              >
                {["Concert", "Corporate", "Festival", "Wedding Show", "Comedy Night", "Live Performance", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Status</label>
              <select
                className="admin-input-base"
                value={form.status}
                onChange={e => set("status", e.target.value)}
                style={{ paddingRight: "2.5rem" }}
              >
                {["Upcoming", "Ongoing", "Completed", "Cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="admin-field-row mt-6">
          <div className="admin-field-group w-full">
            <label className="admin-field-label">Short Description</label>
            <input
              type="text"
              className="admin-input-base"
              value={form.shortDescription}
              onChange={e => set("shortDescription", e.target.value)}
              placeholder="Catchy tagline or sub-title for cards"
            />
          </div>
        </div>

        <div className="admin-field-group mt-6">
          <label className="admin-field-label">Detailed Event Description</label>
          <textarea
            className="admin-input-base admin-textarea"
            style={{ minHeight: "130px" }}
            value={form.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Describe the schedule, outline key acts, tickets info, performative structure..."
          />
        </div>
      </div>

      {/* Section 2: Date, Time & Seating */}
      <div className="admin-form-row-section">
        <h3 className="admin-form-row-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Schedule & Logistics
        </h3>

        <div className="admin-field-row">
          <div className="admin-field-group">
            <label className="admin-field-label">Start Date & Time *</label>
            <input
              type="datetime-local"
              required
              className="admin-input-base"
              value={form.startDate}
              onChange={e => set("startDate", e.target.value)}
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div className="admin-field-group">
            <label className="admin-field-label">End Date & Time (Optional)</label>
            <input
              type="datetime-local"
              className="admin-input-base"
              value={form.endDate}
              onChange={e => set("endDate", e.target.value)}
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>

        <div className="admin-field-row mt-6">
          <div className="admin-field-group">
            <label className="admin-field-label">Capacity Limit (0 = Unlimited)</label>
            <input
              type="number"
              min={0}
              className="admin-input-base"
              value={form.capacity}
              onChange={e => set("capacity", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="admin-field-group">
            <label className="admin-field-label">Tags (comma-separated)</label>
            <input
              type="text"
              className="admin-input-base"
              value={form.tags}
              onChange={e => set("tags", e.target.value)}
              placeholder="e.g. music, outdoor, EDM, corporate"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Cover Image Upload */}
      <div className="admin-form-row-section">
        <h3 className="admin-form-row-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          Media & Branding
        </h3>

        <div className="admin-field-group">
          <label className="admin-field-label mb-4">Cover Image (ImageKit Auto-Renaming Uploader)</label>
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
      </div>

      {/* Section 4: Venue Specifications */}
      <div className="admin-form-row-section">
        <h3 className="admin-form-row-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          Venue Address
        </h3>

        <div className="admin-field-row">
          <div className="admin-field-group">
            <label className="admin-field-label">Venue Name</label>
            <input
              type="text"
              className="admin-input-base"
              value={form.venueName}
              onChange={e => set("venueName", e.target.value)}
              placeholder="e.g. NSCI Dome, Taj Ballroom"
            />
          </div>
          <div className="admin-field-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <label className="admin-field-label">City</label>
              <input
                type="text"
                className="admin-input-base"
                value={form.venueCity}
                onChange={e => set("venueCity", e.target.value)}
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className="admin-field-label">State</label>
              <input
                type="text"
                className="admin-input-base"
                value={form.venueState}
                onChange={e => set("venueState", e.target.value)}
                placeholder="Maharashtra"
              />
            </div>
          </div>
        </div>

        <div className="admin-field-group mt-6">
          <label className="admin-field-label">Full Street Address</label>
          <input
            type="text"
            className="admin-input-base"
            value={form.venueAddress}
            onChange={e => set("venueAddress", e.target.value)}
            placeholder="e.g. Worli, Mumbai, Maharashtra 400018"
          />
        </div>
      </div>

      {/* Feature / Reg. Toggles */}
      <div style={{ display: "flex", gap: "2.5rem", marginTop: "2.5rem", marginBottom: "2.5rem", flexWrap: "wrap" }}>
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => set("featured", !form.featured)}>
          <div className={`admin-checkbox ${form.featured ? "checked" : ""}`} style={{ flexShrink: 0 }}>
            {form.featured && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
          <span className="font-bold text-text text-sm">Feature this event on the Landing Page</span>
        </div>

        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => set("registrationOpen", !form.registrationOpen)}>
          <div className={`admin-checkbox ${form.registrationOpen ? "checked" : ""}`} style={{ flexShrink: 0 }}>
            {form.registrationOpen && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            )}
          </div>
          <span className="font-bold text-text text-sm">Keep Guest Registrations Open</span>
        </div>
      </div>

      {/* Form Buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "1.5rem", paddingTop: "2rem", marginTop: "3.5rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <button type="button" onClick={() => router.back()} className="btn-outline px-10 py-3 rounded-xl text-sm">
          Discard Changes
        </button>
        <button type="submit" disabled={saving || uploading} className="btn-primary px-14 py-3 rounded-xl text-sm font-bold shadow-gold/20">
          {saving ? "Saving Event…" : mode === "edit" ? "Save Event Changes" : "Create New Event"}
        </button>
      </div>
      </form>
      <ConfirmModal 
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
        variant={modal.variant}
        showCancel={modal.showCancel}
        confirmText={modal.confirmText}
      />
    </div>
  );
}
