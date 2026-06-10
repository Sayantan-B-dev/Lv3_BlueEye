"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

import { useLoading } from "@/lib/context/LoadingContext";

interface ArtistFormProps {
  initialData?: any;
  mode: "create" | "edit";
  artistId?: string;
}

export default function ArtistForm({ initialData, mode, artistId }: ArtistFormProps) {
  const router = useRouter();
  const { setIsLoading } = useLoading();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    category: initialData?.category || "",
    category_tag: initialData?.category_tag || "",
    booking_link: initialData?.booking_link || "",
    location: {
      city: initialData?.location?.city || "",
      state: initialData?.location?.state || "India",
    },
    about: Array.isArray(initialData?.about) ? initialData.about.join("\n") : initialData?.about || "",
    performance: {
      duration_minutes: {
        min: initialData?.performance?.duration_minutes?.min || 30,
        max: initialData?.performance?.duration_minutes?.max || 90,
      },
      team_members: {
        min: initialData?.performance?.team_members?.min || 1,
        max: initialData?.performance?.team_members?.max || 1,
      },
      genres: initialData?.performance?.genres || [],
      languages: initialData?.performance?.languages || [],
    },
    media: {
      images: initialData?.media?.images || [],
      videos: initialData?.media?.videos || [],
    },
    faq: initialData?.faq || [],
  });

  const [newGenre, setNewGenre] = useState("");
  const [newLang, setNewLang] = useState("");
  const [newVideo, setNewVideo] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const folder = `/${formData.category || 'misc'}/${formData.name.replace(/\s+/g, '_')}`;
      data.append("folder", folder);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          media: {
            ...prev.media,
            images: [...prev.media.images, result.filePath]
          }
        }));
      } else {
        setModal({
          isOpen: true,
          title: "Upload Failed",
          message: result.error || "Failed to upload image.",
          variant: "danger",
          showCancel: false,
          confirmText: "Close",
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      console.error(err);
      setModal({
        isOpen: true,
        title: "Upload Error",
        message: err.message || "Image upload failed. Please try again.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        about: formData.about.split("\n").filter((p: string) => p.trim() !== ""),
      };

      const url = mode === "edit" ? `/api/artists/id/${artistId}` : "/api/artists";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setModal({
          isOpen: true,
          title: mode === "edit" ? "Profile Updated" : "Profile Created",
          message: mode === "edit" ? "The artist profile has been successfully updated." : "The new artist profile has been successfully created.",
          variant: "success",
          showCancel: false,
          confirmText: "Awesome",
          onConfirm: () => {
            router.push("/admin/artists");
            router.refresh();
          },
        });
      } else {
        setModal({
          isOpen: true,
          title: "Operation Failed",
          message: result.error || result.message || "Failed to save artist profile.",
          variant: "danger",
          showCancel: false,
          confirmText: "Close",
          onConfirm: () => {},
        });
      }
    } catch (err: any) {
      console.error(err);
      setModal({
        isOpen: true,
        title: "Operation Error",
        message: err.message || "Something went wrong. Please try again.",
        variant: "danger",
        showCancel: false,
        confirmText: "Close",
        onConfirm: () => {},
      });
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-form-main-card">
      <form onSubmit={handleSubmit} className="w-full">
        
        {/* Section 1: Basic Information */}
        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Basic Information
          </h3>
          
          <div className="admin-field-row">
            <div className="admin-field-group">
              <label className="admin-field-label">Artist Full Name</label>
              <input 
                type="text" required
                className="admin-input-base" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Primary Category</label>
              <input 
                type="text" required
                className="admin-input-base" 
                placeholder="e.g. Singer, DJ, Band"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-field-row mt-4">
            <div className="admin-field-group">
              <label className="admin-field-label">Category Tag / Sub-category</label>
              <input 
                type="text" 
                className="admin-input-base" 
                value={formData.category_tag}
                onChange={e => setFormData({ ...formData, category_tag: e.target.value })}
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">Direct Booking URL (Optional)</label>
              <input 
                type="text" 
                className="admin-input-base" 
                value={formData.booking_link}
                onChange={e => setFormData({ ...formData, booking_link: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-field-row mt-4">
            <div className="admin-field-group">
              <label className="admin-field-label">City</label>
              <input 
                type="text" 
                className="admin-input-base" 
                value={formData.location.city}
                onChange={e => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
              />
            </div>
            <div className="admin-field-group">
              <label className="admin-field-label">State / Region</label>
              <input 
                type="text" 
                className="admin-input-base" 
                value={formData.location.state}
                onChange={e => setFormData({ ...formData, location: { ...formData.location, state: e.target.value } })}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Performance Specs */}
        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Performance Specs
          </h3>

          <div className="admin-field-row">
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="admin-field-group">
                <label className="admin-field-label">Min Duration (min)</label>
                <input 
                  type="number" 
                  className="admin-input-base" 
                  value={formData.performance.duration_minutes.min}
                  onChange={e => setFormData({ ...formData, performance: { ...formData.performance, duration_minutes: { ...formData.performance.duration_minutes, min: parseInt(e.target.value) } } })}
                />
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Max Duration (min)</label>
                <input 
                  type="number" 
                  className="admin-input-base" 
                  value={formData.performance.duration_minutes.max}
                  onChange={e => setFormData({ ...formData, performance: { ...formData.performance, duration_minutes: { ...formData.performance.duration_minutes, max: parseInt(e.target.value) } } })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="admin-field-group">
                <label className="admin-field-label">Team size (Min)</label>
                <input 
                  type="number" 
                  className="admin-input-base" 
                  value={formData.performance.team_members.min}
                  onChange={e => setFormData({ ...formData, performance: { ...formData.performance, team_members: { ...formData.performance.team_members, min: parseInt(e.target.value) } } })}
                />
              </div>
              <div className="admin-field-group">
                <label className="admin-field-label">Team size (Max)</label>
                <input 
                  type="number" 
                  className="admin-input-base" 
                  value={formData.performance.team_members.max}
                  onChange={e => setFormData({ ...formData, performance: { ...formData.performance, team_members: { ...formData.performance.team_members, max: parseInt(e.target.value) } } })}
                />
              </div>
            </div>
          </div>

          <div className="admin-field-row mt-6">
            <div className="admin-field-group w-full">
              <label className="admin-field-label">Genres</label>
              <div className="admin-tag-input-wrap">
                <input 
                  type="text" className="admin-input-base" placeholder="Add genre..." 
                  value={newGenre} onChange={e=>setNewGenre(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); if(newGenre){setFormData({...formData, performance: {...formData.performance, genres: [...formData.performance.genres, newGenre]}}); setNewGenre("");}}}}
                />
                <button type="button" onClick={()=>{if(newGenre){setFormData({...formData, performance: {...formData.performance, genres: [...formData.performance.genres, newGenre]}}); setNewGenre("");}}} className="btn-primary px-6 rounded-xl">Add</button>
              </div>
              <div className="admin-tag-container">
                {formData.performance.genres.map((g:string)=>(
                  <div key={g} className="admin-tag">
                    {g} <span onClick={()=>setFormData({...formData, performance:{...formData.performance, genres: formData.performance.genres.filter((x:any)=>x!==g)}})} className="admin-tag-remove">×</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-field-group w-full">
              <label className="admin-field-label">Languages</label>
              <div className="admin-tag-input-wrap">
                <input 
                  type="text" className="admin-input-base" placeholder="Add language..." 
                  value={newLang} onChange={e=>setNewLang(e.target.value)}
                  onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); if(newLang){setFormData({...formData, performance: {...formData.performance, languages: [...formData.performance.languages, newLang]}}); setNewLang("");}}}}
                />
                <button type="button" onClick={()=>{if(newLang){setFormData({...formData, performance: {...formData.performance, languages: [...formData.performance.languages, newLang]}}); setNewLang("");}}} className="btn-primary px-6 rounded-xl">Add</button>
              </div>
              <div className="admin-tag-container">
                {formData.performance.languages.map((l:string)=>(
                  <div key={l} className="admin-tag opacity-80">
                    {l} <span onClick={()=>setFormData({...formData, performance:{...formData.performance, languages: formData.performance.languages.filter((x:any)=>x!==l)}})} className="admin-tag-remove">×</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Biography & About */}
        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Biography & About
          </h3>
          <div className="admin-field-group">
            <label className="admin-field-label">Detailed Story / Biography (Press Enter for new paragraph)</label>
            <textarea 
              className="admin-input-base admin-textarea"
              placeholder="Tell the artist's story here..."
              value={formData.about}
              onChange={e => setFormData({ ...formData, about: e.target.value })}
            ></textarea>
          </div>
        </div>

        {/* Section 4: Media & Gallery */}
        <div className="admin-form-row-section">
          <h3 className="admin-form-row-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Media & Gallery
          </h3>
          
          <div className="admin-field-row">
            <div className="w-full">
              <label className="admin-field-label mb-4">Photos (Gallery Management)</label>
              <div className="admin-upload-grid">
                {formData.media.images.map((img: string, i: number) => (
                  <div key={i} className="admin-upload-item">
                    <img src={img.startsWith('http') ? img : `${process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}/${img}`} alt={`Gallery image ${i + 1}`} />
                    <div onClick={() => setFormData({...formData, media: {...formData.media, images: formData.media.images.filter((_: string, idx: number)=>idx!==i)}})} className="admin-upload-delete">
                      Remove
                    </div>
                  </div>
                ))}
                <label className="admin-upload-btn min-h-[140px]">
                  {uploading ? (
                    <span className="animate-spin text-xl">⏳</span>
                  ) : (
                    <>
                      <span className="text-3xl">+</span>
                      <span className="text-[10px] mt-2 uppercase font-black tracking-widest">Add Photo</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="w-full">
              <label className="admin-field-label">YouTube Video Links</label>
              <div className="admin-tag-input-wrap">
                <input 
                  type="text" className="admin-input-base" placeholder="Paste YouTube URL..." 
                  value={newVideo} onChange={e => setNewVideo(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); if(newVideo){ setFormData({...formData, media: {...formData.media, videos: [...formData.media.videos, newVideo]}}); setNewVideo(""); } } }}
                />
                <button type="button" onClick={() => { if(newVideo){ setFormData({...formData, media: {...formData.media, videos: [...formData.media.videos, newVideo]}}); setNewVideo(""); } }} className="btn-primary px-6 rounded-xl">Add</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                {formData.media.videos.map((vid: string, i: number) => {
                  const id = vid.match(/(?:v\/|v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)?.[1];
                  const thumb = id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null;
                  return (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: '16px', padding: '0.75rem', overflow: 'hidden'
                    }}>
                      {/* Thumbnail */}
                      <div style={{ width: '96px', height: '60px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', position: 'relative' }}>
                        {thumb ? (
                          <img src={thumb} alt={`YouTube video thumbnail for ${vid}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', opacity: 0.3 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="2"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                          </div>
                        )}
                        {/* YT badge */}
                        <div style={{ position: 'absolute', bottom: '4px', right: '4px', background: '#ff0000', borderRadius: '4px', padding: '1px 4px', display: 'flex', alignItems: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                        </div>
                      </div>
                      {/* URL */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>YouTube</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text2)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{vid}</div>
                      </div>
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, media: {...formData.media, videos: formData.media.videos.filter((_: any, idx: number) => idx !== i)}})}
                        style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(196,30,58,0.1)', border: '1px solid rgba(196,30,58,0.2)', color: 'var(--crimson)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-6 pt-12 mt-4">
          <button type="button" onClick={() => router.back()} className="btn-outline px-12 py-4 rounded-2xl">Discard Changes</button>
          <button type="submit" disabled={loading} className="btn-primary px-20 py-4 rounded-2xl text-lg font-black shadow-gold/20">
            {loading ? "Saving Profile..." : mode === 'edit' ? "Save Artist Profile" : "Create New Artist"}
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
