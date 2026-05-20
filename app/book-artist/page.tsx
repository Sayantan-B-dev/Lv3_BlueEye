"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLoading } from "@/lib/context/LoadingContext";

function BookArtistForm() {
  const searchParams = useSearchParams();
  const artistSlug = searchParams.get("artist") || "";
  const { setIsLoading } = useLoading();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("loading");
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd);

    // Default valid ObjectId if artist not found via slug (or keep empty if backend handles it)
    data.artistId = "5f8f8c44b54764421b7156e9"; 

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok) {
        setStatus("success");
        console.log("Inquiry submitted! Our team will contact you shortly.");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
        console.error(result.message || "Failed to submit inquiry.");
      }
    } catch {
      setStatus("error");
      console.error("Network error occurred.");
    } finally {
      setIsLoading(false);
      setStatus("idle");
    }
  };

  return (
    <div className="section-inner pt-nav flex min-h-[90vh] flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="section-label justify-center mx-auto w-full">Booking Desk</div>
        <h1 className="section-title text-center mb-10">Book an <span>Artist</span></h1>

        <form onSubmit={handleSubmit} className="admin-section space-y-8">
          
          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Artist Name</label>
            <input 
              type="text" 
              name="artistName" 
              defaultValue={artistSlug ? artistSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : ""} 
              required 
              className="filter-input"
              placeholder="e.g. Arijit Singh"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Your Name</label>
              <input type="text" name="clientName" required className="filter-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Email Address</label>
              <input type="email" name="clientEmail" required className="filter-input" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Phone Number</label>
              <input type="tel" name="clientPhone" required className="filter-input" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Event Date</label>
              <input type="date" name="eventDate" className="filter-input" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Type of Event</label>
            <select name="eventType" required className="filter-select w-full">
              <option value="Wedding">Wedding</option>
              <option value="Corporate">Corporate</option>
              <option value="Private Party">Private Party</option>
              <option value="College">College</option>
              <option value="Concert">Concert / Festival</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Message / Requirements</label>
            <textarea 
              name="message" 
              rows={4} 
              className="filter-input min-h-[120px]"
              placeholder="Tell us about your event expectations..."
            ></textarea>
          </div>

          <button 
            type="submit" 
            disabled={status === "loading"} 
            className="btn-primary w-full py-4 text-lg mt-4 shadow-gold/20"
          >
            {status === "loading" ? "Submitting Inquiry..." : "Submit Inquiry ✦"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function BookArtistPage() {
  return (
    <Suspense fallback={<div className="section-inner pt-nav text-center">Loading form...</div>}>
      <BookArtistForm />
    </Suspense>
  );
}
