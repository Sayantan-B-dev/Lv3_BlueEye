"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbqInit?: boolean;
  }
}

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

function loadPixel() {
  if (!PIXEL_ID || typeof window === "undefined" || window._fbqInit) return;
  window._fbqInit = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(s);
  s.onload = () => {
    window.fbq?.("init", PIXEL_ID);
    window.fbq?.("track", "PageView");
  };
}

/** Fire a Meta Pixel event. No-op when pixel is not configured. */
export function trackPixel(event: string, params?: Record<string, any>) {
  if (!PIXEL_ID || typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq("track", event, params);
  } catch {
    /* analytics must never break checkout */
  }
}

/** Mount once in the root layout. PageView auto-fires; other events via trackPixel. */
export default function MetaPixel() {
  useEffect(() => {
    loadPixel();
  }, []);
  return null;
}
