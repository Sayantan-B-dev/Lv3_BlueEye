"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import TurnstileWidget from "@/components/security/TurnstileWidget";

interface ApplicantFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: {
    _id: string;
    name: string;
    category: string;
    applicantEmail: string;
    applicantPhone: string;
    city: string;
    state: string;
    about: string;
    genres: string[];
    languages: string[];
    durationMin: number;
    durationMax: number;
    teamMin: number;
    teamMax: number;
    images: string[];
    videos: string[];
  };
}

export default function ApplicantForm({ isOpen, onClose, onSuccess, initialData }: ApplicantFormProps) {
  const { data: session } = useSession();
  const [categories, setCategories] = useState<string[]>([]);
  const [step, setStep] = useState<"form" | "success" | "error">("form");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);

  const [form, setForm] = useState({
    name: "",
    category: "",
    applicantEmail: "",
    applicantPhone: "",
    city: "",
    state: "India",
    about: "",
    genres: [] as string[],
    languages: [] as string[],
    durationMin: 30,
    durationMax: 90,
    teamMin: 1,
    teamMax: 1,
    images: [] as string[],
    videos: [] as string[],
  });

  const [newGenre, setNewGenre] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newVideo, setNewVideo] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setStep("form");
    setErrorMsg("");
    setTurnstileToken("");
    setTurnstileReset((n) => n + 1);
    if (initialData) {
      setForm({
        name: initialData.name,
        category: initialData.category,
        applicantEmail: initialData.applicantEmail,
        applicantPhone: initialData.applicantPhone,
        city: initialData.city || "",
        state: initialData.state || "India",
        about: initialData.about || "",
        genres: initialData.genres || [],
        languages: initialData.languages || [],
        durationMin: initialData.durationMin ?? 30,
        durationMax: initialData.durationMax ?? 90,
        teamMin: initialData.teamMin ?? 1,
        teamMax: initialData.teamMax ?? 1,
        images: initialData.images || [],
        videos: initialData.videos || [],
      });
    } else {
      const sessionEmail = (session?.user as any)?.email || "";
      setForm({
        name: "", category: "", applicantEmail: sessionEmail, applicantPhone: "",
        city: "", state: "India", about: "",
        genres: [], languages: [],
        durationMin: 30, durationMax: 90, teamMin: 1, teamMax: 1,
        images: [], videos: [],
      });
    }
    setNewGenre(""); setNewLang(""); setNewVideo("");
    fetch("/api/filters")
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data.categories); })
      .catch(() => {});
  }, [isOpen, initialData]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const authRes = await fetch("/api/upload-auth");
      const authData = await authRes.json();
      if (!authData.success) throw new Error(authData.error || "Failed to get upload credentials");

      const { signature, token, expire, publicKey } = authData.data;
      const folder = `/applicants/${form.name.replace(/\s+/g, "_") || "unknown"}`;

      const body = new FormData();
      body.append("file", file);
      body.append("fileName", file.name);
      body.append("publicKey", publicKey);
      body.append("signature", signature);
      body.append("token", token);
      body.append("expire", String(expire));
      body.append("useUniqueFileName", "true");
      body.append("folder", folder);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body,
      });
      const uploadResult = await uploadRes.json();
      if (uploadResult.filePath) {
        setForm(prev => ({ ...prev, images: [...prev.images, uploadResult.filePath] }));
      } else {
        setErrorMsg(uploadResult.message || uploadResult.error || "Upload failed");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.images.length === 0) { setErrorMsg("At least one image is required."); return; }
    if (form.videos.length === 0) { setErrorMsg("At least one YouTube video URL is required."); return; }
    if (!form.category) { setErrorMsg("Please select a category."); return; }

    const isEdit = !!initialData;

    if (
      !isEdit &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      !turnstileToken
    ) {
      setErrorMsg("Please complete the security check.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const payload = {
        name: form.name,
        category: form.category,
        applicantEmail: form.applicantEmail,
        applicantPhone: form.applicantPhone,
        location: { city: form.city, state: form.state },
        about: form.about || undefined,
        performance: {
          duration_minutes: { min: form.durationMin, max: form.durationMax },
          team_members: { min: form.teamMin, max: form.teamMax },
          genres: form.genres,
          languages: form.languages,
        },
        media: { images: form.images, videos: form.videos },
        ...(isEdit ? {} : { turnstileToken }),
      };

      const url = isEdit
        ? `/api/users/applications/${initialData!._id}`
        : "/api/artist-applications";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setStep("success");
        onSuccess?.();
      } else {
        setErrorMsg(result.message || result.error || "Failed to submit application.");
        setStep("error");
        setTurnstileToken("");
        setTurnstileReset((n) => n + 1);
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStep("error");
      setTurnstileToken("");
      setTurnstileReset((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content animate-pop"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: "640px", width: "90vw", maxHeight: "90vh", overflowY: "auto", padding: 0 }}
      >
        {step === "success" ? (
          <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(0, 210, 255, 0.1)", border: "2px solid rgba(0, 210, 255, 0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1.5rem",
              }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00d2ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.75rem", color: "var(--text)" }}>
              Application Submitted!
            </h2>
            <p style={{ color: "var(--text2)", marginBottom: "2rem", lineHeight: 1.7 }}>
              We will review your profile and get back to you soon. Our team typically responds within 2-3 business days.
            </p>
            <button onClick={onClose} className="btn-primary px-12 py-4 rounded-2xl">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text)" }}>
                {initialData ? "Edit Your Application" : "Submit Your Artist Profile"}
              </h2>
              <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {errorMsg && (
              <div style={{ padding: "0.75rem 1rem", borderRadius: 12, background: "rgba(255,71,87,0.1)", border: "1px solid rgba(255,71,87,0.2)", color: "#ff4757", fontSize: "0.85rem", marginBottom: "1rem" }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Full Name *</label>
                <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} style={inputStyle} placeholder="Your stage name" />
              </div>

              <div>
                <label style={labelStyle}>Category *</label>
                <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inputStyle}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Email *</label>
                <input required type="email" value={form.applicantEmail} onChange={e => setForm({...form, applicantEmail: e.target.value})} style={inputStyle} placeholder="your@email.com" />
              </div>

              <div>
                <label style={labelStyle}>Phone *</label>
                <input required type="tel" value={form.applicantPhone} onChange={e => setForm({...form, applicantPhone: e.target.value})} style={inputStyle} placeholder="+91 98765 43210" />
              </div>

              <div>
                <label style={labelStyle}>City</label>
                <input value={form.city} onChange={e => setForm({...form, city: e.target.value})} style={inputStyle} placeholder="Mumbai" />
              </div>

              <div>
                <label style={labelStyle}>State</label>
                <input value={form.state} onChange={e => setForm({...form, state: e.target.value})} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Min Duration (min)</label>
                <input type="number" value={form.durationMin} onChange={e => setForm({...form, durationMin: parseInt(e.target.value) || 30})} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Max Duration (min)</label>
                <input type="number" value={form.durationMax} onChange={e => setForm({...form, durationMax: parseInt(e.target.value) || 90})} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Min Team Size</label>
                <input type="number" value={form.teamMin} onChange={e => setForm({...form, teamMin: parseInt(e.target.value) || 1})} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Max Team Size</label>
                <input type="number" value={form.teamMax} onChange={e => setForm({...form, teamMax: parseInt(e.target.value) || 1})} style={inputStyle} />
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>Genres</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={newGenre} onChange={e => setNewGenre(e.target.value)} style={{...inputStyle, flex: 1}} placeholder="Add genre..."
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newGenre) { setForm({...form, genres: [...form.genres, newGenre]}); setNewGenre(""); } } }} />
                <button type="button" onClick={() => { if (newGenre) { setForm({...form, genres: [...form.genres, newGenre]}); setNewGenre(""); } }} className="btn-primary px-4 rounded-xl">Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                {form.genres.map(g => (
                  <span key={g} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: 20, background: "rgba(0, 210, 255, 0.1)", border: "1px solid rgba(0, 210, 255, 0.15)", fontSize: "0.8rem", color: "var(--text2)" }}>
                    {g}
                    <span onClick={() => setForm({...form, genres: form.genres.filter(x => x !== g)})} style={{ cursor: "pointer", color: "var(--text3)" }}>x</span>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>Languages</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={newLang} onChange={e => setNewLang(e.target.value)} style={{...inputStyle, flex: 1}} placeholder="Add language..."
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newLang) { setForm({...form, languages: [...form.languages, newLang]}); setNewLang(""); } } }} />
                <button type="button" onClick={() => { if (newLang) { setForm({...form, languages: [...form.languages, newLang]}); setNewLang(""); } }} className="btn-primary px-4 rounded-xl">Add</button>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
                {form.languages.map(l => (
                  <span key={l} style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: 20, background: "rgba(255, 165, 2, 0.1)", border: "1px solid rgba(255, 165, 2, 0.15)", fontSize: "0.8rem", color: "var(--text2)" }}>
                    {l}
                    <span onClick={() => setForm({...form, languages: form.languages.filter(x => x !== l)})} style={{ cursor: "pointer", color: "var(--text3)" }}>x</span>
                  </span>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>About / Bio</label>
              <textarea value={form.about} onChange={e => setForm({...form, about: e.target.value})} style={{...inputStyle, minHeight: 100, resize: "vertical"}} placeholder="Tell us about yourself..." />
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>Photos * (at least 1)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.5rem" }}>
                {form.images.map((img, i) => (
                  <div key={i} style={{ position: "relative", width: 80, height: 80, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)" }}>
                    <img src={img.startsWith("http") ? img : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${img}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div onClick={() => setForm({...form, images: form.images.filter((_, idx) => idx !== i)})} style={{ position: "absolute", top: 2, right: 2, width: 20, height: 20, borderRadius: "50%", background: "rgba(255,71,87,0.9)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, cursor: "pointer" }}>x</div>
                  </div>
                ))}
                <label style={{ width: 80, height: 80, borderRadius: 12, border: "2px dashed var(--border)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text3)", fontSize: "0.7rem", gap: 4 }}>
                  {uploading ? (
                    <span style={{ fontSize: "0.65rem" }}>Uploading...</span>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Upload
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} style={{ display: "none" }} />
                </label>
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={labelStyle}>YouTube Video URLs * (at least 1)</label>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={newVideo} onChange={e => setNewVideo(e.target.value)} style={{...inputStyle, flex: 1}} placeholder="https://youtube.com/watch?v=..."
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (newVideo) { setForm({...form, videos: [...form.videos, newVideo]}); setNewVideo(""); } } }} />
                <button type="button" onClick={() => { if (newVideo) { setForm({...form, videos: [...form.videos, newVideo]}); setNewVideo(""); } }} className="btn-primary px-4 rounded-xl">Add</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.5rem" }}>
                {form.videos.map((vid, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: 10, background: "var(--bg)", border: "1px solid var(--border)", fontSize: "0.8rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                    <span style={{ flex: 1, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{vid}</span>
                    <span onClick={() => setForm({...form, videos: form.videos.filter((_, idx) => idx !== i)})} style={{ cursor: "pointer", color: "var(--crimson)" }}>x</span>
                  </div>
                ))}
              </div>
            </div>

            {!initialData && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "center" }}>
                <TurnstileWidget
                  onToken={setTurnstileToken}
                  resetKey={turnstileReset}
                />
              </div>
            )}

            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} className="btn-outline px-8 py-4 rounded-2xl">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-primary px-10 py-4 rounded-2xl text-base font-black shadow-gold/20">
                {submitting ? "Saving..." : initialData ? "Update Application" : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 600,
  color: "var(--text2)",
  marginBottom: "0.35rem",
  letterSpacing: "0.02em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.85rem",
  borderRadius: 12,
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontSize: "0.88rem",
  outline: "none",
  boxSizing: "border-box",
};
