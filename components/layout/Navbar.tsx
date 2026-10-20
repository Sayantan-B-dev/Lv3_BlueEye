"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { siteConfig } from "@/lib/config/site";

export default function Navbar() {
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleNav = () => {
    setNavOpen(!navOpen);
    document.body.style.overflow = !navOpen ? "hidden" : "";
  };

  const closeNav = () => {
    setNavOpen(false);
    document.body.style.overflow = "";
  };

  const user = session?.user as any;

  return (
    <>
      <header
        id="site-header"
        style={{
          background: scrolled
            ? 'rgba(5, 7, 10, 0.65)'
            : 'rgba(5, 7, 10, 0.35)',

          backdropFilter: scrolled
            ? 'blur(18px) saturate(180%)'
            : 'blur(10px) saturate(140%)',

          WebkitBackdropFilter: scrolled
            ? 'blur(18px) saturate(180%)'
            : 'blur(10px) saturate(140%)',

          boxShadow: scrolled
            ? '0 4px 30px rgba(0,0,0,.4), 0 1px 0 rgba(0, 210, 255, 0.1)'
            : '0 4px 20px rgba(0,0,0,.15)',

          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          borderBottom: scrolled
            ? '1px solid rgba(0, 210, 255, 0.5)'
            : '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <div className="hdr-inner">
          <Link href="/" className="logo" onClick={closeNav} prefetch={false}>
            <div className="logo-icon">
              <Image
                src="/icon-96.webp"
                alt="BlueEye Logo"
                width={40}
                height={40}
                sizes="40px"
                style={{ width: "100%", height: "100%", borderRadius: "inherit" }}
                priority
              />
            </div>
            <div className="logo-text">
              {siteConfig.name}
              <span>Premium Artist Booking</span>
            </div>
          </Link>

          <nav>
            <Link href="/categories" prefetch={false}>Categories</Link>
            <Link href="/artists" prefetch={false}>Artists</Link>
            <Link href="/events" prefetch={false}>Events</Link>
            <Link href="/about" prefetch={false}>About</Link>
            <Link href="/contact" prefetch={false}>Contact</Link>
          </nav>

          <div className="hdr-actions" style={{ position: 'relative' }}>
            <Link href="/book-artist" prefetch={false} className="btn-primary btn-xs" style={{ padding: '0.5rem 1.25rem' }}>Book Artist ✦</Link>

            {/* Account Dropdown Menu (PC Only) - Rendered on the RIGHT of Book Artist */}
            {session ? (
              <div className="pc-only" style={{ position: 'relative' }}>
                <button 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                  onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                  className="btn-outline btn-xs"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem', 
                    padding: '0.5rem 1rem', 
                    borderColor: 'rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.02)',
                    color: 'var(--text)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-primary)',
                    fontSize: '0.78rem',
                    fontWeight: 600
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <span>{user?.name || "Account"}</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {dropdownOpen && (
                  <div 
                    className="dropdown-menu"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 0.65rem)',
                      background: 'rgba(10, 17, 26, 0.96)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: '1px solid rgba(0, 210, 255, 0.25)',
                      borderRadius: '14px',
                      padding: '0.4rem',
                      minWidth: '170px',
                      boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                      zIndex: 1000,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem'
                    }}
                  >
                    <Link 
                      href="/profile" 
                      prefetch={false}
                      className="dropdown-item" 
                      style={{ 
                        padding: '0.6rem 0.9rem', 
                        fontSize: '0.82rem', 
                        borderRadius: '10px', 
                        color: 'var(--text)', 
                        textDecoration: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        transition: 'background var(--tr)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      My Profile
                    </Link>

                    {user?.role === "admin" && (
                      <Link 
                        href="/admin" 
                        prefetch={false}
                        className="dropdown-item" 
                        style={{ 
                          padding: '0.6rem 0.9rem', 
                          fontSize: '0.82rem', 
                          borderRadius: '10px', 
                          color: 'var(--gold)', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.5rem',
                          transition: 'background var(--tr)'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
                        Admin Panel
                      </Link>
                    )}

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0.2rem 0' }} />

                    <button 
                      onClick={() => signOut()} 
                      className="dropdown-item" 
                      style={{ 
                        padding: '0.6rem 0.9rem', 
                        fontSize: '0.82rem', 
                        borderRadius: '10px', 
                        color: 'var(--crimson)', 
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        width: '100%',
                        transition: 'background var(--tr)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="pc-only">
                <Link href="/login" prefetch={false} className="btn-outline btn-xs" style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}>Login</Link>
              </div>
            )}

            <button className="hamburger" onClick={toggleNav} aria-label="Menu">
              <span style={navOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}}></span>
              <span style={navOpen ? { opacity: 0 } : {}}></span>
              <span style={navOpen ? { transform: 'rotate(-45deg) translate(5px, -5px)' } : {}}></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className={`mobile-nav ${navOpen ? 'open' : ''}`} id="mobileNav">
        <Link href="/#categories" onClick={closeNav} prefetch={false}>Categories</Link>
        <Link href="/artists" onClick={closeNav} prefetch={false}>Artists</Link>
        <Link href="/events" onClick={closeNav} prefetch={false}>Events</Link>
        <Link href="/about" onClick={closeNav} prefetch={false}>About</Link>
        <Link href="/contact" onClick={closeNav} prefetch={false}>Contact</Link>
        {user?.role === "admin" && (
          <Link href="/admin" onClick={closeNav} prefetch={false} style={{ color: 'var(--gold)' }}>Admin Panel</Link>
        )}
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '1rem 0' }} />
        {session ? (
          <>
            <Link href="/profile" onClick={closeNav} prefetch={false}>My Profile</Link>
            <button onClick={() => { signOut(); closeNav(); }} style={{ background: 'none', border: 'none', color: 'var(--crimson)', textAlign: 'left', fontSize: '1.25rem', padding: '0.75rem 0', cursor: 'pointer' }}>Logout</button>
          </>
        ) : (
          <>
            <Link href="/login" onClick={closeNav} prefetch={false}>Login</Link>
            <Link href="/login?view=register" onClick={closeNav} prefetch={false}>Register</Link>
          </>
        )}
      </nav>
    </>
  );
}
