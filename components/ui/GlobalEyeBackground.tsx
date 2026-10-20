"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const IMAGES = [
  { src: "/eye.webp", width: 1000, height: 1000 },
  { src: "/eye2.webp", width: 1000, height: 1000 },
] as const;

const STORAGE_KEY = "blueeye:eye-background:v1";
const DISPLAY_MS = 2000;
const FADE_MS = 1000;

type CachedImages = Record<string, string>;

// Survives remounts in the same tab so we do not re-read or re-encode.
let memoryCache: CachedImages | null = null;

function readCache(): CachedImages {
  if (memoryCache) return memoryCache;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    memoryCache = parsed as CachedImages;
    return memoryCache;
  } catch {
    return {};
  }
}

function writeCache(cache: CachedImages) {
  memoryCache = cache;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Quota exceeded or storage disabled — keep the in-memory copy for this tab.
  }
}

function toDataUrl(src: string): Promise<string> {
  return fetch(src, { cache: "force-cache" })
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load ${src}`);
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === "string"
              ? resolve(reader.result)
              : reject(new Error("Unexpected reader result"));
          reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
          reader.readAsDataURL(blob);
        })
    );
}

export default function GlobalEyeBackground() {
  const eyeRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sources, setSources] = useState<string[] | null>(null);
  const rafRef = useRef<number | null>(null);

  // Read localStorage first; only the very first visit pays for the download.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const cached = readCache();
      const cachedSources = IMAGES.map((image) => cached[image.src]);

      if (cachedSources.every(Boolean)) {
        if (!cancelled) setSources(cachedSources as string[]);
        return;
      }

      try {
        const resolved = await Promise.all(
          IMAGES.map(async (image) => cached[image.src] || (await toDataUrl(image.src)))
        );
        if (cancelled) return;

        const nextCache: CachedImages = { ...cached };
        IMAGES.forEach((image, i) => {
          nextCache[image.src] = resolved[i];
        });
        writeCache(nextCache);
        setSources(resolved);
      } catch {
        // Any failure falls back to the normal network URLs.
        if (!cancelled) setSources(IMAGES.map((image) => image.src));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sources) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % sources.length);
    }, DISPLAY_MS + FADE_MS);
    return () => clearInterval(timer);
  }, [sources]);

  // Tilt interaction.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      if (rafRef.current !== null) return;

      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        if (!eyeRef.current) return;

        const maxTilt = 45;
        const dx = (e.clientX - window.innerWidth / 2) / window.innerWidth;
        const dy = (e.clientY - window.innerHeight / 2) / window.innerHeight;
        const clampedDx = Math.max(-1, Math.min(1, dx));
        const clampedDy = Math.max(-1, Math.min(1, dy));

        eyeRef.current.style.transform = `perspective(800px) rotateX(${-clampedDy * maxTilt}deg) rotateY(${clampedDx * maxTilt}deg)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={eyeRef} className="global-eye-container" aria-hidden="true">
      <div className="eyeball-stage">
        {sources?.map((src, i) => (
          <div
            key={IMAGES[i].src}
            className="eyeball-slide"
            style={{
              opacity: activeIndex === i ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
            }}
          >
            <Image
              src={src}
              alt={`Eye image ${i + 1}`}
              fill
              sizes="min(1000px, 95vw)"
              className="eyeball-img"
              draggable={false}
              unoptimized
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "low"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
