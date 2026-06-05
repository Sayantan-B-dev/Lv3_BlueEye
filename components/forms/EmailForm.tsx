"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ConfirmModal from "@/components/ui/ConfirmModal";

type Variant = "booking" | "contact";
type FormStatus = "idle" | "loading" | "success" | "error" | "cooldown";

interface BookingForm {
  artistName: string;
  clientPhone: string;
  eventDate: string;
  eventType: string;
  message: string;
}

interface ContactForm {
  message: string;
}

type Props = {
  variant: Variant;
  title?: string;
  description?: string;
  endpoint?: string;
};

const COOLDOWN_MS = 30 * 60 * 1000;

function formatCooldown(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

export default function EmailForm({ variant, title, description, endpoint }: Props) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";

  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const isBooking = variant === "booking";

  const [bookingForm, setBookingForm] = useState<BookingForm>({
    artistName: searchParams?.get("artist")?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "",
    clientPhone: "",
    eventDate: "",
    eventType: "Wedding",
    message: "",
  });

  const [contactForm, setContactForm] = useState<ContactForm>({
    message: "",
  });

  useEffect(() => {
    if (searchParams?.get("artist")) {
      const slug = searchParams.get("artist") || "";
      setBookingForm((f) => ({
        ...f,
        artistName: slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    fetch("/api/cooldown")
      .then((r) => r.json())
      .then((data) => {
        if (!data.allowed) {
          setStatus("cooldown");
          setCooldownRemaining(data.remainingMs);
        }
      })
      .catch(() => {});
  }, [authStatus]);

  const tickCooldown = useCallback(() => {
    setCooldownRemaining((prev) => {
      const next = prev - 1000;
      if (next <= 0) {
        setStatus("idle");
        return 0;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (status !== "cooldown" || cooldownRemaining <= 0) return;
    const id = setInterval(tickCooldown, 1000);
    return () => clearInterval(id);
  }, [status, cooldownRemaining, tickCooldown]);

  if (authStatus === "loading") {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2rem 1rem",
          color: "var(--text3)",
          fontSize: "0.875rem",
        }}
      >
        Loading...
      </div>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <div
        className="page-card"
        style={{
          textAlign: "center",
          padding: "3rem 2rem",
          marginTop: "2rem",
        }}
      >
        <p
          style={{
            margin: "0 0 1.5rem",
            fontSize: "0.9rem",
            color: "var(--text2)",
            lineHeight: 1.7,
          }}
        >
          Sign in to send a message. We use your account details so we can get back to you.
        </p>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="btn-primary"
          style={{ textDecoration: "none", display: "inline-block" }}
        >
          Sign in to continue ✦
        </Link>
      </div>
    );
  }

  const sessionName = session?.user?.name || "";
  const sessionEmail = session?.user?.email || "";

  const defaultTitle = isBooking ? "Book an Artist" : "Send Us a Message";
  const defaultDescription = isBooking
    ? "Fill in the details below and our team will contact you shortly."
    : "Have a privacy concern or question? Fill out the form below and we'll get back to you.";

  const actTitle = title || defaultTitle;
  const actDescription = description || defaultDescription;

  function handleCooldownError(result: { cooldown?: number; message?: string }) {
    setStatus("cooldown");
    setCooldownRemaining(result.cooldown || COOLDOWN_MS);
    if (result.message) setStatusMsg(result.message);
  }

  function handleCommonError(result: { message?: string; error?: string }) {
    setStatus("error");
    setStatusMsg(result.message || result.error || "Something went wrong.");
  }

  const handleBookingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setStatusMsg("");

    const { artistName, clientPhone, eventDate, eventType, message } = bookingForm;

    if (!artistName.trim()) {
      setStatus("error");
      setStatusMsg("Artist name is required.");
      return;
    }
    if (!clientPhone || clientPhone.replace(/\D/g, "").length < 10) {
      setStatus("error");
      setStatusMsg("Please enter a valid phone number (at least 10 digits).");
      return;
    }

    const payload = {
      artistId: "5f8f8c44b54764421b7156e9",
      artistName: artistName.trim(),
      clientName: sessionName,
      clientEmail: sessionEmail,
      clientPhone,
      eventDate: eventDate || undefined,
      eventType,
      message: message.trim() || undefined,
    };

    try {
      const res = await fetch(endpoint || "/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.status === 429) {
        handleCooldownError(result);
        return;
      }
      if (res.ok) {
        setStatus("success");
        setStatusMsg("Inquiry submitted! Our team will contact you shortly.");
        setShowSuccessModal(true);
        setBookingForm({ artistName: "", clientPhone: "", eventDate: "", eventType: "Wedding", message: "" });
      } else {
        handleCommonError(result);
      }
    } catch {
      setStatus("error");
      setStatusMsg("Network error occurred.");
    }
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    setStatusMsg("");

    const { message } = contactForm;
    if (!message.trim()) {
      setStatus("error");
      setStatusMsg("Message is required.");
      return;
    }

    try {
      const res = await fetch(endpoint || "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: sessionName,
          email: sessionEmail,
          message: message.trim(),
        }),
      });
      const result = await res.json();
      if (res.status === 429) {
        handleCooldownError(result);
        return;
      }
      if (result.success) {
        setStatus("success");
        setStatusMsg("Your message has been sent. We'll get back to you shortly.");
        setContactForm({ message: "" });
      } else {
        handleCommonError(result);
      }
    } catch {
      setStatus("error");
      setStatusMsg("Network error. Please try again.");
    }
  };

  const isCooldown = status === "cooldown";

  if (isBooking) {
    return (
      <>
        <ConfirmModal
          isOpen={showSuccessModal}
          title="Request Received! ✦"
          message="Your inquiry has been successfully submitted. Our team will review your details and contact you shortly to confirm the booking."
          variant="success"
          showCancel={false}
          confirmText="Done"
          onConfirm={() => {
            setShowSuccessModal(false);
            router.push("/");
          }}
          onCancel={() => setShowSuccessModal(false)}
        />

        <div className="w-full max-w-2xl">
          <div className="section-label justify-center mx-auto w-full">Booking Desk</div>
          <h1 className="section-title text-center mb-10">{actTitle}</h1>

          {isCooldown && (
            <div className="mb-6 p-4 text-amber-400 text-sm font-medium text-center bg-amber-500/10 border border-amber-500/20 rounded-xl">
              You can send another inquiry in{" "}
              <span style={{ fontWeight: 700, fontSize: "1rem" }}>{formatCooldown(cooldownRemaining)}</span>
            </div>
          )}
          {status === "error" && (
            <div className="mb-6 p-4 text-red-500 text-sm font-medium text-center bg-red-500/10 border border-red-500/20 rounded-xl">
              {statusMsg}
            </div>
          )}
          {status === "success" && !showSuccessModal && (
            <div className="mb-6 p-4 text-green-500 text-sm font-medium text-center bg-green-500/10 border border-green-500/20 rounded-xl">
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleBookingSubmit} className="admin-section space-y-8">
            <div>
              <label className="form-label">Artist Name</label>
              <input
                type="text"
                required
                className="filter-input"
                value={bookingForm.artistName}
                onChange={(e) => setBookingForm((f) => ({ ...f, artistName: e.target.value }))}
                placeholder="e.g. Arijit Singh"
                disabled={isCooldown}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Your Name</label>
                <input
                  type="text"
                  className="filter-input"
                  value={sessionName}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="filter-input"
                  value={sessionEmail}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="filter-input"
                  value={bookingForm.clientPhone}
                  onChange={(e) => setBookingForm((f) => ({ ...f, clientPhone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  disabled={isCooldown}
                />
              </div>
              <div>
                <label className="form-label">Event Date</label>
                <input
                  type="date"
                  className="filter-input"
                  value={bookingForm.eventDate}
                  onChange={(e) => setBookingForm((f) => ({ ...f, eventDate: e.target.value }))}
                  disabled={isCooldown}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Type of Event</label>
              <select
                required
                className="filter-select w-full"
                value={bookingForm.eventType}
                onChange={(e) => setBookingForm((f) => ({ ...f, eventType: e.target.value }))}
                disabled={isCooldown}
              >
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate</option>
                <option value="Private Party">Private Party</option>
                <option value="College">College</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Message / Requirements</label>
              <textarea
                rows={4}
                className="filter-input min-h-[120px]"
                value={bookingForm.message}
                onChange={(e) => setBookingForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Tell us about your event expectations..."
                disabled={isCooldown}
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading" || isCooldown}
              className="btn-primary w-full py-4 text-lg mt-4 shadow-gold/20"
            >
              {status === "loading" ? "Submitting Inquiry..." : isCooldown ? `Wait ${formatCooldown(cooldownRemaining)}` : "Submit Inquiry ✦"}
            </button>
          </form>
        </div>
      </>
    );
  }

  return (
    <div className="page-card" style={{ marginTop: "2rem" }}>
      <h2
        style={{
          fontSize: "1.15rem",
          fontWeight: 700,
          color: "var(--gold)",
          marginBottom: "0.5rem",
        }}
      >
        {actTitle}
      </h2>
      <p style={{ color: "var(--text2)", lineHeight: 1.8, marginBottom: "1.5rem" }}>
        {actDescription}
      </p>

      <form onSubmit={handleContactSubmit} className="admin-section" style={{ padding: 0, border: "none" }}>
        {isCooldown && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(212, 160, 23, 0.1)",
              border: "1px solid rgba(212, 160, 23, 0.2)",
              color: "#d4a017",
              marginBottom: "1.5rem",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            You can send another message in{" "}
            <span style={{ fontWeight: 700, fontSize: "1rem" }}>{formatCooldown(cooldownRemaining)}</span>
          </div>
        )}
        {status === "success" && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(0, 200, 80, 0.1)",
              border: "1px solid rgba(0, 200, 80, 0.2)",
              color: "#00c850",
              marginBottom: "1.5rem",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {statusMsg}
          </div>
        )}
        {status === "error" && (
          <div
            style={{
              padding: "1rem",
              borderRadius: "12px",
              background: "rgba(255, 0, 0, 0.1)",
              border: "1px solid rgba(255, 0, 0, 0.2)",
              color: "#ff4444",
              marginBottom: "1.5rem",
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {statusMsg}
          </div>
        )}

        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div>
            <label className="form-label">Your Name</label>
            <input
              type="text"
              className="filter-input"
              value={sessionName}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="filter-input"
              value={sessionEmail}
              disabled
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <label className="form-label">Message</label>
          <textarea
            required
            rows={5}
            className="filter-input"
            style={{ minHeight: "120px", resize: "vertical" }}
            value={contactForm.message}
            onChange={(e) => setContactForm({ message: e.target.value })}
            placeholder="Describe your privacy concern or question..."
            disabled={isCooldown}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading" || isCooldown}
          className="btn-primary"
          style={{ marginTop: "1.5rem", border: "none", cursor: isCooldown ? "not-allowed" : "pointer" }}
        >
          {status === "loading" ? "Sending..." : isCooldown ? `Wait ${formatCooldown(cooldownRemaining)}` : "Send Message ✦"}
        </button>
      </form>
    </div>
  );
}
