"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/config/site";

export default function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo" style={{ marginBottom: '.5rem', display: 'inline-flex' }}>
              <div className="logo-text">{siteConfig.name || "BlueEye"} <span>India's Artist Platform</span></div>
            </Link>
            <p>India's leading platform to discover and book world-class artists for every stage and occasion.</p>
            <div className="social-links">
              <a className="social-link" href={siteConfig.links.instagram} aria-label="Instagram">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
              </a>
              <a className="social-link" href={siteConfig.links.youtube} aria-label="YouTube">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 8s-.3-2-1.2-2.8c-1.1-1.2-2.4-1.2-3-1.3C15.4 4 12 4 12 4s-3.4 0-5.8.2c-.6.1-1.9.1-3 1.3C2.3 6 2 8 2 8S1.7 10.3 1.7 12.5v2.1c0 2.2.3 4.4.3 4.4s.3 2 1.2 2.8c1.1 1.2 2.6 1.1 3.3 1.2C8.4 23 12 23 12 23s3.4 0 5.8-.2c.6-.1 1.9-.1 3-1.3.9-.8 1.2-2.8 1.2-2.8s.3-2.2.3-4.4v-2.1C22.3 10.3 22 8 22 8z"/><polygon points="10,15 15,12 10,9 10,15" fill="currentColor" stroke="none"/></svg>
              </a>
              <a className="social-link" href={siteConfig.links.twitter} aria-label="Twitter / X">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a className="social-link" href={siteConfig.links.facebook} aria-label="Facebook">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Categories</h4>
            <ul>
              <li><Link href="/category/singer">Singers</Link></li>
              <li><Link href="/category/comedian">Comedians</Link></li>
              <li><Link href="/category/rapper">Rappers</Link></li>
              <li><Link href="/category/dj">DJs</Link></li>
              <li><Link href="/category/bollywood">Bollywood Celebrities</Link></li>
              <li><Link href="/category/tv">TV Artists</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Top Cities</h4>
            <ul>
              <li><Link href="/city/mumbai">Mumbai</Link></li>
              <li><Link href="/city/delhi">Delhi</Link></li>
              <li><Link href="/city/bengaluru">Bengaluru</Link></li>
              <li><Link href="/city/kolkata">Kolkata</Link></li>
              <li><Link href="/city/chennai">Chennai</Link></li>
              <li><Link href="/city/dubai">Dubai</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/#how">How It Works</Link></li>
<li><Link href="/for-artists">For Artists</Link></li>
              <li><Link href="/blog">Blog</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2018 {siteConfig.name}. All rights reserved. Made with ♥ in India.</p>
          <div className="footer-bottom-links">
            <Link href="/#">Terms</Link>
            <Link href="/#">Privacy</Link>
            <Link href="/#">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
