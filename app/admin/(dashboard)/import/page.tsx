"use client";

import { useState } from "react";

export default function AdminImportPage() {
  const [importType, setImportType] = useState<"artists" | "events" | "reviews">("artists");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<any>(null);

  const handleImport = async () => {
    try {
      setStatus("loading");
      const parsed = JSON.parse(jsonText);
      const data = Array.isArray(parsed) ? parsed : [parsed];

      const endpoint = importType === "artists" 
        ? "/api/admin/artists" 
        : importType === "events" 
        ? "/api/admin/events" 
        : "/api/admin/reviews";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const resData = await res.json();
      
      if (res.ok) {
        setStatus("success");
        setResult(resData.data);
      } else {
        setStatus("error");
        setResult(resData.message);
      }
    } catch (e: any) {
      setStatus("error");
      setResult("Invalid JSON: " + e.message);
    }
  };

  return (
    <div className="admin-form-main-card">
      {/* Header */}
      <div className="admin-form-row-section">
        <div className="flex items-center gap-4 mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <div>
            <h1 className="admin-title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
              Bulk JSON <span style={{ color: 'var(--gold)' }}>Import</span>
            </h1>
            <p className="admin-subtitle">Paste a JSON array to bulk import or update the database.</p>
          </div>
        </div>
      </div>

      {/* Type Selection */}
      <div className="admin-form-row-section">
        <h3 className="admin-form-row-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Import Type
        </h3>
        <select
          value={importType}
          onChange={(e) => setImportType(e.target.value as any)}
          className="admin-input-base"
          style={{ maxWidth: '300px' }}
        >
          <option value="artists">Artists</option>
          <option value="events">Events</option>
          <option value="reviews">Reviews</option>
        </select>
      </div>

      {/* JSON Input */}
      <div className="admin-form-row-section">
        <h3 className="admin-form-row-title">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
          JSON Payload
        </h3>
        <textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          rows={24}
          className="admin-input-base admin-textarea"
          style={{ fontFamily: 'monospace', fontSize: '0.85rem', minHeight: '500px', whiteSpace: 'pre' }}
          placeholder={
            importType === "artists" 
              ? `[
  {
    "id": 1,
    "slug": "artist-name",
    "name": "Artist Name",
    "category": "Singer",
    "category_tag": "Vocalist",
    "source": { "url": "https://example.com/source", "input_category": "singers", "input_page": 1 },
    "location": { "city": "Mumbai", "state": "MH", "country": "India" },
    "performance": {
      "duration_minutes": { "min": 60, "max": 120 },
      "team_members": { "min": 1, "max": 4 },
      "genres": ["Pop", "Jazz"],
      "languages": ["English", "Hindi"]
    },
    "booking": { "url": "https://booking.com/artist" },
    "booking_link": "https://booking.com/artist",
    "about": "Detailed bio here...",
    "custom_fields": { "awards": "Grammy 2023" },
    "faq": [
      { "question": "Are you available for weddings?", "answer": "Yes, I perform at weddings." }
    ],
    "media": {
      "videos": ["https://youtube.com/watch?v=123"],
      "images": ["https://example.com/img1.jpg"]
    },
    "featured": false
  }
]` 
              : importType === "events"
              ? `[
  {
    "title": "Summer Music Festival",
    "slug": "summer-music-festival-2024",
    "description": "Full HTML or markdown description here.",
    "shortDescription": "A quick summary of the event.",
    "category": "Concert",
    "venue": {
      "name": "Grand Arena",
      "city": "Mumbai",
      "state": "MH",
      "address": "123 Stadium Road"
    },
    "startDate": "2024-12-01T18:00:00Z",
    "endDate": "2024-12-01T23:00:00Z",
    "coverImage": "https://example.com/cover.jpg",
    "artists": ["65f1a2b3c4d5e6f7a8b9c0d1"],
    "status": "Upcoming",
    "featured": true,
    "capacity": 5000,
    "registrationOpen": true,
    "tags": ["music", "live", "festival"]
  }
]`
              : `[
  {
    "user": "65f1a2b3c4d5e6f7a8b9c0d1",
    "rating": 5,
    "text": "Absolutely incredible experience! The booking process was seamless.",
    "isEdited": false
  }
]`
          }
        ></textarea>
        <div className="flex justify-between items-center mt-6">
          <p className="admin-field-label" style={{ marginBottom: 0 }}>
            Ensure the JSON strictly follows the {importType} schema.
          </p>
          <button
            onClick={handleImport}
            disabled={status === "loading" || !jsonText.trim()}
            className="btn-primary"
            style={{ padding: '0.9rem 3rem', borderRadius: '14px', opacity: (!jsonText.trim() ? 0.5 : 1) }}
          >
            {status === "loading" ? "Processing..." : "Start Bulk Import"}
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="admin-form-row-section" style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
          <h3 className="admin-form-row-title" style={{ color: status === 'success' ? 'var(--gold)' : 'var(--crimson)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {status === 'success'
                ? <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
                : <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              }
            </svg>
            {status === "success" ? "Import Successful" : "Import Failed"}
          </h3>
          {status === "success" ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
              {[
                { label: 'Total', value: result.total, color: 'var(--text)' },
                { label: 'Created', value: result.created, color: 'var(--gold)' },
                { label: 'Updated', value: result.updated, color: '#20bf6b' },
                { label: 'Failed', value: result.failed, color: 'var(--crimson)' },
              ].map(({ label, value, color }) => (
                <div key={label} className="admin-card" style={{ gap: '0.5rem', padding: '1.5rem' }}>
                  <div className="admin-card-label">{label}</div>
                  <div className="admin-card-value" style={{ color }}>{value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '1.25rem', background: 'rgba(196,30,58,0.08)', borderRadius: '14px', border: '1px solid rgba(196,30,58,0.2)', color: 'var(--crimson)', fontSize: '0.9rem', fontFamily: 'monospace' }}>
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
