"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FavoritesContextType {
  favorites: string[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => Promise<void>;
  loading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  isFavorite: () => false,
  toggleFavorite: async () => {},
  loading: false,
});

export function useFavorites() {
  return useContext(FavoritesContext);
}

export default function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites on mount if authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/users/favorites")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setFavorites(data.data);
          }
        })
        .catch((err) => console.error("Failed to load favorites", err))
        .finally(() => setLoading(false));
    } else if (status === "unauthenticated") {
      setFavorites([]);
      setLoading(false);
    }
  }, [status]);

  const isFavorite = (id: string) => favorites.includes(id);

  const toggleFavorite = async (id: string) => {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }

    // Optimistic update
    const wasFavorite = isFavorite(id);
    if (wasFavorite) {
      setFavorites(favorites.filter((fav) => fav !== id));
    } else {
      setFavorites([...favorites, id]);
    }

    try {
      const res = await fetch("/api/users/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId: id }),
      });
      const data = await res.json();
      
      // Sync with server if needed
      if (data.success && Array.isArray(data.data)) {
        setFavorites(data.data);
      }
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      // Revert optimistic update on error
      if (wasFavorite) {
        setFavorites([...favorites, id]);
      } else {
        setFavorites(favorites.filter((fav) => fav !== id));
      }
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}
