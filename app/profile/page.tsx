"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ArtistCard from "@/components/ui/ArtistCard";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // User Profile States (for live DB data)
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileContact, setProfileContact] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Review states
  const [myReview, setMyReview] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      // 1. Fetch favorites
      fetch("/api/users/favorites")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setFavorites(data.data);
          }
        })
        .finally(() => setLoading(false));

      // 2. Fetch live user profile
      fetch("/api/users/profile")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setProfile(data.data);
            setProfileName(data.data.name || "");
            setProfileAddress(data.data.address || "");
            setProfileContact(data.data.contactDetails || "");
          }
        });

      // 3. Fetch user's review
      fetch("/api/reviews/mine")
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data && Object.keys(data.data).length > 0) {
            setMyReview(data.data);
            setRating(data.data.rating);
            setText(data.data.text);
          }
        });

      // 4. Fetch user's inquiries
      fetch("/api/users/inquiries")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setInquiries(data.data);
          }
        });
    }
  }, [status]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName,
          address: profileAddress,
          contactDetails: profileContact
        })
      });
      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setProfileSuccess("Profile updated successfully!");
        setIsEditingProfile(false);
        if (data.data.address) {
          setReviewError(""); // Clear review address requirement error if resolved
        }
      } else {
        setProfileError(data.message || "Failed to update profile.");
      }
    } catch (err) {
      setProfileError("An error occurred. Please try again.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setReviewError("Please enter your review text.");
      return;
    }

    // Client side address requirement check
    if (!profile?.address || !profile.address.trim()) {
      setReviewError("Address is required to submit a review. Please update your profile address first.");
      return;
    }

    setSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ rating, text })
      });
      const data = await res.json();
      if (data.success) {
        setMyReview(data.data);
        setReviewSuccess(data.data.isEdited ? "Review updated successfully!" : "Review submitted successfully!");
        setIsEditing(false);
      } else {
        setReviewError(data.message || "Failed to submit review.");
      }
    } catch (err: any) {
      setReviewError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDelete = async () => {
    if (!confirm("Are you sure you want to delete your review?")) return;
    setSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        setMyReview(null);
        setText("");
        setRating(5);
        setReviewSuccess("Review deleted successfully!");
        setIsEditing(false);
      } else {
        setReviewError(data.message || "Failed to delete review.");
      }
    } catch (err) {
      setReviewError("An error occurred while deleting your review.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="section-inner" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader">Loading your profile...</div>
      </div>
    );
  }

  const user = session?.user as any;
  const displayName = profile?.name || user?.name || "Member";
  const displayEmail = profile?.email || user?.email;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="section-inner" style={{ padding: 'calc(var(--hdr-h) + 4rem) 1rem 6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '4rem', alignItems: 'stretch' }}>
        
        {/* Profile Card / Edit Profile details */}
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          {isEditingProfile ? (
            <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff', fontFamily: 'var(--font-display)' }}>Edit Profile Details</h3>
                
                {profileError && <div style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(255,107,107,0.2)' }}>{profileError}</div>}

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.25rem' }}>Full Name</label>
                  <input 
                    type="text" 
                    value={profileName} 
                    onChange={(e) => setProfileName(e.target.value)} 
                    required 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '0.6rem 0.85rem', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '0.9rem' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.25rem' }}>Address <span style={{ color: 'var(--gold)', fontSize: '0.75rem' }}>(Required to review)</span></label>
                  <input 
                    type="text" 
                    value={profileAddress} 
                    onChange={(e) => setProfileAddress(e.target.value)} 
                    placeholder="e.g. Delhi, Mumbai" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '0.6rem 0.85rem', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '0.9rem' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.25rem' }}>Contact Details</label>
                  <input 
                    type="text" 
                    value={profileContact} 
                    onChange={(e) => setProfileContact(e.target.value)} 
                    placeholder="e.g. Phone number, WhatsApp" 
                    style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', padding: '0.6rem 0.85rem', borderRadius: '12px', color: '#fff', outline: 'none', fontSize: '0.9rem' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <button type="submit" disabled={profileSaving} className="btn-primary" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => { setIsEditingProfile(false); setProfileName(profile?.name || ""); setProfileAddress(profile?.address || ""); setProfileContact(profile?.contactDetails || ""); }} className="btn-outline" style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold), var(--saffron))', display: 'grid', placeItems: 'center', fontSize: '1.8rem', fontWeight: 900, color: '#0a0807', flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>{displayName}</h2>
                    <p style={{ color: 'var(--text3)', fontSize: '0.85rem' }}>@{profile?.username || user?.username || "user"}</p>
                  </div>
                </div>

                {profileSuccess && <div style={{ background: 'rgba(76,201,240,0.1)', color: '#4cc9f0', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginTop: '1rem', border: '1px solid rgba(76,201,240,0.2)' }}>{profileSuccess}</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                    <p style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{displayEmail}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</span>
                    <p style={{ color: profile?.address ? 'var(--text2)' : 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                      {profile?.address || "No address added yet (required to submit reviews)"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Details</span>
                    <p style={{ color: profile?.contactDetails ? 'var(--text2)' : 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                      {profile?.contactDetails || "No contact details added yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem', marginTop: 'auto' }}>
                <button type="button" onClick={() => { setIsEditingProfile(true); setProfileSuccess(""); }} className="btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                  Edit Profile
                </button>
                <span style={{ padding: '0.4rem 0.75rem', background: 'rgba(212,160,23,0.1)', color: 'var(--gold)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  {profile?.role || user?.role || "user"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Review Card */}
        <div style={{ background: 'var(--surface)', padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff', fontFamily: 'var(--font-display)' }}>
            {myReview ? "Your Platform Review" : "Write a Review"}
          </h3>
          <p style={{ color: 'var(--text3)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {myReview ? "You have already reviewed the platform. You can update or delete your review below." : "Share your experience with ArtistHub. Your review will be featured on our home page!"}
          </p>

          {reviewError && <div style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(255,107,107,0.2)' }}>{reviewError}</div>}
          {reviewSuccess && <div style={{ background: 'rgba(76,201,240,0.1)', color: '#4cc9f0', padding: '0.75rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(76,201,240,0.2)' }}>{reviewSuccess}</div>}

          {myReview && !isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', color: 'var(--gold)', fontSize: '1.25rem' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} style={{ color: i < myReview.rating ? 'var(--gold)' : 'rgba(255,255,255,0.15)' }}>★</span>
                    ))}
                  </div>
                  {myReview.isEdited && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', fontStyle: 'italic' }}>(edited)</span>
                  )}
                </div>
                <p style={{ color: 'var(--text2)', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '0.75rem' }}>
                  "{myReview.text}"
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(true)} 
                  className="btn-outline" 
                  style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  Edit Review
                </button>
                <button 
                  type="button" 
                  onClick={handleReviewDelete} 
                  className="btn-outline" 
                  style={{ padding: '0.5rem 1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.2)' }}
                >
                  Delete Review
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.25rem' }}>Rating</label>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '1.75rem',
                          padding: 0,
                          color: star <= (hoverRating || rating) ? 'var(--gold)' : 'rgba(255,255,255,0.15)',
                          transition: 'color 0.15s ease, transform 0.1s ease',
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text2)', marginBottom: '0.5rem' }}>Your Review</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Tell us what you like about ArtistHub..."
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border)',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      color: '#fff',
                      outline: 'none',
                      resize: 'none',
                      fontSize: '0.9rem',
                      fontFamily: 'inherit',
                      flex: 1,
                      minHeight: '120px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="btn-primary" 
                  style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  {submitting ? 'Submitting...' : myReview ? 'Update Review' : 'Submit Review'}
                </button>
                {myReview && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setRating(myReview.rating);
                      setText(myReview.text);
                      setReviewError("");
                    }} 
                    className="btn-outline"
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '10px', fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
      <div className="section-header" style={{ marginTop: '1rem' }}>
        <h2 className="section-title">Your <span>Inquiries</span></h2>
        <p className="section-desc">Booking requests you have submitted to our team.</p>
      </div>

      {inquiries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)', marginBottom: '4rem' }}>
          <p style={{ color: 'var(--text3)' }}>You haven't submitted any inquiries yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '4rem' }}>
          {inquiries.map((inq) => (
            <div key={inq._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>{inq.artistName}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text3)' }}>
                  {inq.eventType} • {inq.eventDate ? new Date(inq.eventDate).toLocaleDateString() : 'Date TBD'}
                </p>
                {inq.message && <p style={{ fontSize: '0.85rem', color: 'var(--text2)', marginTop: '0.5rem', fontStyle: 'italic' }}>"{inq.message}"</p>}
              </div>
              <div>
                <span style={{ padding: '0.4rem 0.75rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', background: inq.status === 'New' ? 'rgba(76,201,240,0.1)' : inq.status === 'Contacted' ? 'rgba(212,160,23,0.1)' : 'rgba(255,107,107,0.1)', color: inq.status === 'New' ? '#4cc9f0' : inq.status === 'Contacted' ? 'var(--gold)' : '#ff6b6b' }}>
                  {inq.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">Your <span>Favorites</span></h2>
        <p className="section-desc">Artists you've shortlisted for your future events.</p>
      </div>

      {favorites.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed var(--border)' }}>
          <p style={{ color: 'var(--text3)', marginBottom: '1.5rem' }}>You haven't added any favorites yet.</p>
          <Link href="/artists" className="btn-primary">Explore Artists</Link>
        </div>
      ) : (
        <div className="artists-grid">
          {favorites.map((artist, i) => (
            <ArtistCard key={artist._id} artist={artist} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
