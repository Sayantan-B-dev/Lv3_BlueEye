"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  loading: boolean;
}

const STORAGE_KEY = "blueeye:favorites:v1";

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  loading: false,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

function readCachedFavorites(): string[] | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeCachedFavorites(favorites: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Storage is optional; favorites still work for this page.
  }
}

export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useSession();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") {
      if (status === "unauthenticated") {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // Storage is optional.
        }
      }
      return;
    }

    let cancelled = false;

    const load = async () => {
      const cached = readCachedFavorites();
      if (cancelled) return;
      if (cached) {
        setFavorites(cached);
        setLoading(false);
        return;
      }

      try {
        // One request per authenticated tab session instead of one per page load.
        const res = await fetch("/api/users/favorites");
        if (cancelled) return;
        if (!res.ok) {
          setFavorites([]);
          return;
        }
        const list = await res.json().then((data) =>
          data.success && Array.isArray(data.data) ? (data.data as string[]) : []
        );
        if (cancelled) return;
        setFavorites(list);
        writeCachedFavorites(list);
      } catch {
        if (!cancelled) setFavorites([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void Promise.resolve().then(load);

    return () => {
      cancelled = true;
    };
  }, [status]);

  const effectiveFavorites = status === "authenticated" ? favorites : [];
  const effectiveLoading =
    status === "loading" ? true : status === "unauthenticated" ? false : loading;

  const isFavorite = (id: string) => effectiveFavorites.includes(id);

  const toggleFavorite = async (id: string) => {
    const wasFavorite = isFavorite(id);
    const optimistic = wasFavorite
      ? effectiveFavorites.filter((fav) => fav !== id)
      : [...effectiveFavorites, id];

    setFavorites(optimistic);
    writeCachedFavorites(optimistic);

    try {
      const res = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: id }),
      });

      if (res.status === 401) {
        setFavorites(favorites);
        writeCachedFavorites(favorites);
        router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFavorites(data.data);
        writeCachedFavorites(data.data);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      setFavorites(favorites);
      writeCachedFavorites(favorites);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites: effectiveFavorites, isFavorite, toggleFavorite, loading: effectiveLoading }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}
