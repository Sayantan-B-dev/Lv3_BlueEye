"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveMediaUrl } from "@/lib/seo/metadata";

export type ArtistSuggestion = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  location?: { city?: string; state?: string };
  media?: { images?: string[] };
};

type ArtistSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  name?: string;
  variant?: "hero" | "filter";
  category?: string;
  city?: string;
  submitPath?: "/search" | "/artists";
  required?: boolean;
};

function thumbUrl(artist: ArtistSuggestion): string | undefined {
  const raw = artist.media?.images?.[0];
  if (!raw) return undefined;
  return resolveMediaUrl(raw) ?? (raw.startsWith("http") ? raw : undefined);
}

export default function ArtistSearchInput({
  value,
  onChange,
  onSubmit,
  placeholder = "Search artist by name…",
  name = "q",
  variant = "hero",
  category,
  city,
  submitPath = "/search",
  required,
}: ArtistSearchInputProps) {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ArtistSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const fetchSuggestions = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (trimmed.length < 1) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ q: trimmed, limit: "8" });
        if (category) params.set("category", category);
        if (city) params.set("city", city);

        const res = await fetch(`/api/search/suggest?${params}`);
        const json = await res.json();
        const artists: ArtistSuggestion[] = json.success ? json.data?.artists ?? [] : [];
        setSuggestions(artists);
        setOpen(artists.length > 0);
        setActiveIndex(-1);
      } catch {
        setSuggestions([]);
        setOpen(false);
      } finally {
        setLoading(false);
      }
    },
    [category, city]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSuggestions(value);
    }, 280);
    return () => clearTimeout(timer);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function goToSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setOpen(false);
    if (onSubmit) {
      onSubmit(trimmed);
      return;
    }
    const params = new URLSearchParams({ q: trimmed });
    if (category) params.set("category", category);
    if (city) params.set("city", city);
    router.push(`${submitPath}?${params.toString()}`);
  }

  function selectArtist(artist: ArtistSuggestion) {
    setOpen(false);
    onChange(artist.name);
    router.push(`/artists/${artist.slug}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        goToSearch(value);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        selectArtist(suggestions[activeIndex]);
      } else {
        goToSearch(value);
      }
    }
  }

  const inputClass = variant === "hero" ? "artist-search-input--hero" : "artist-search-input--filter";

  const searchIcon = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );

  return (
    <div
      ref={rootRef}
      className={`artist-search-autocomplete artist-search-autocomplete--${variant}`}
    >
      {variant === "filter" && (
        <span className="artist-search-filter-icon" aria-hidden="true">
          {searchIcon}
        </span>
      )}
      <input
        ref={inputRef}
        type="text"
        name={name}
        className={inputClass}
        placeholder={placeholder}
        value={value}
        required={required}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          if (e.target.value.trim()) setOpen(true);
        }}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />

      {open && (suggestions.length > 0 || loading) && (
        <ul id={listId} className="artist-search-suggestions" role="listbox">
          {loading && suggestions.length === 0 && (
            <li className="artist-search-suggestion artist-search-suggestion--status">Searching…</li>
          )}
          {suggestions.map((artist, index) => {
            const img = thumbUrl(artist);
            const isActive = index === activeIndex;
            return (
              <li key={artist._id} role="option" id={`${listId}-opt-${index}`} aria-selected={isActive}>
                <Link
                  href={`/artists/${artist.slug}`}
                  className={`artist-search-suggestion${isActive ? " is-active" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={(e) => {
                    e.preventDefault();
                    selectArtist(artist);
                  }}
                >
                  <span className="artist-search-suggestion-thumb">
                    {img ? (
                      <img src={img} alt="" width={40} height={40} />
                    ) : (
                      <span aria-hidden>🎤</span>
                    )}
                  </span>
                  <span className="artist-search-suggestion-body">
                    <span className="artist-search-suggestion-name">{artist.name}</span>
                    <span className="artist-search-suggestion-meta">
                      {artist.category}
                      {artist.location?.city ? ` · ${artist.location.city}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
          {value.trim() && !loading && (
            <li role="option">
              <button
                type="button"
                className="artist-search-suggestion artist-search-suggestion--all"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => goToSearch(value)}
              >
                Search all results for &ldquo;{value.trim()}&rdquo; ↗
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
