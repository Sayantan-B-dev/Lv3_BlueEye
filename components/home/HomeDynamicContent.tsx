"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import HomeBackground from "./HomeBackground";
import HeroSection from "./HeroSection";
import CategoryGrid from "./CategoryGrid";
import FeaturedArtists from "./FeaturedArtists";
import HomeLoadProgress, { type HomeSectionKey } from "./HomeLoadProgress";
import { HeroSkeleton, CategorySkeleton, FeaturedSkeleton } from "./HomePageSkeleton";
import type { HomePageData } from "@/lib/services/homeDataService";
import { cacheConfig } from "@/lib/config/cache";

const CACHE_KEY = cacheConfig.homeData.clientSessionKey;
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

const INITIAL_READY: Record<HomeSectionKey, boolean> = {
  ambient: false,
  hero: false,
  categories: false,
  featured: false,
};

function progressFromReady(ready: Record<HomeSectionKey, boolean>) {
  const keys = Object.keys(ready) as HomeSectionKey[];
  const done = keys.filter((k) => ready[k]).length;
  return Math.round((done / keys.length) * 100);
}

export default function HomeDynamicContent({ initialData: _initialData }: { initialData?: HomePageData | null }) {
  const { data: session } = useSession();
  const initialData = _initialData ?? null;
  const hasServerData = !!initialData;
  const [data, setData] = useState<Partial<HomePageData>>(initialData ?? {});
  const [ready, setReady] = useState<Record<HomeSectionKey, boolean>>(
    hasServerData
      ? { ambient: true, hero: true, categories: true, featured: true }
      : INITIAL_READY
  );
  const [progress, setProgress] = useState(hasServerData ? 100 : 0);
  const [showProgress, setShowProgress] = useState(!hasServerData);
  const [favorites, setFavorites] = useState<string[]>([]);

  const markReady = useCallback((key: HomeSectionKey) => {
    setReady((prev) => {
      if (prev[key]) return prev;
      const next = { ...prev, [key]: true };
      setProgress(progressFromReady(next));
      return next;
    });
  }, []);

  const finishLoading = useCallback((homeData: HomePageData) => {
    setData(homeData);
    setReady({
      ambient: true,
      hero: true,
      categories: true,
      featured: true,
    });
    setProgress(100);
    window.setTimeout(() => setShowProgress(false), 550);
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (hasServerData) return;

    async function loadHomeData() {
      try {
        const cachedStr = typeof window !== "undefined" ? localStorage.getItem(CACHE_KEY) : null;
        if (cachedStr) {
          try {
            const parsed = JSON.parse(cachedStr);
            // Check if cache has expired
            if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_EXPIRY_MS) {
              if (!cancelled) finishLoading(parsed.data as HomePageData);
              return;
            } else {
              localStorage.removeItem(CACHE_KEY);
            }
          } catch {
            localStorage.removeItem(CACHE_KEY);
          }
        }

        setShowProgress(true);
        setProgress(0);
        setReady(INITIAL_READY);
        setData({});

        let randomArtists: HomePageData["randomArtists"] = [];
        let categories: string[] = [];
        let counts: Record<string, number> = {};
        let artistsDone = false;
        let categoriesDone = false;

        const tryComplete = () => {
          if (cancelled || !artistsDone || !categoriesDone) return;
          const full: HomePageData = { randomArtists, categories, counts };
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: full, timestamp: Date.now() }));
          markReady("hero");
          finishLoading(full);
        };

        const artistsPromise = fetch("/api/home-data/artists")
          .then((r) => r.json())
          .then((artistsJson) => {
            if (cancelled || !artistsJson.success) return;
            randomArtists = artistsJson.data.randomArtists ?? [];
            setData((d) => ({ ...d, randomArtists }));
            markReady("ambient");
            markReady("featured");
            artistsDone = true;
            tryComplete();
          });

        const categoriesPromise = fetch("/api/home-data/categories")
          .then((r) => r.json())
          .then((categoriesJson) => {
            if (cancelled || !categoriesJson.success) return;
            categories = categoriesJson.data.categories ?? [];
            counts = categoriesJson.data.counts ?? {};
            setData((d) => ({ ...d, categories, counts }));
            markReady("categories");
            categoriesDone = true;
            tryComplete();
          });

        await Promise.allSettled([artistsPromise, categoriesPromise]);

        if (!cancelled && (!artistsDone || !categoriesDone)) {
          setShowProgress(false);
        }
      } catch (err) {
        console.error("Failed to load home page dynamic data:", err);
        if (!cancelled) setShowProgress(false);
      }
    }

    loadHomeData();
    return () => {
      cancelled = true;
    };
  }, [finishLoading, markReady, hasServerData]);

  useEffect(() => {
    if (!session) return;

    async function loadFavorites() {
      try {
        const res = await fetch("/api/users/favorites").then((r) => r.json());
        if (res.success && Array.isArray(res.data)) {
          setFavorites(res.data.map((f: { _id?: string }) => f._id || f));
        }
      } catch (err) {
        console.error("Failed to load favorites:", err);
      }
    }
    loadFavorites();
  }, [session]);

  const trailImages = useMemo(() => {
    if (!data.randomArtists) return [] as string[];
    return data.randomArtists
      .map((a: { media?: { images?: string[] } }) => a.media?.images?.[0])
      .filter((img: string | undefined): img is string => !!img);
  }, [data.randomArtists]);

  const displayArtists = data.randomArtists?.slice(0, 6) ?? [];
  const categories = data.categories ?? [];
  const isFullyLoaded = ready.hero && ready.categories && ready.featured;

  return (
    <div className={isFullyLoaded ? "animate-fade-in" : undefined}>
      <HomeBackground trailImages={ready.ambient ? trailImages : []} />

      <HomeLoadProgress progress={progress} ready={ready} visible={showProgress} />

      {ready.hero ? (
        <div className="home-section-enter">
          <HeroSection categories={categories} artists={data.randomArtists ?? []} />
        </div>
      ) : (
        <HeroSkeleton />
      )}

      <div className="genre-divider-marquee">
        <div className="divider-marquee-track">
          {[1, 2].map((loopIndex) => (
            <div className="divider-marquee-group" key={loopIndex}>
              <span className="marquee-node">🎤 SINGER <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🎭 COMEDIAN <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🎧 DJ <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🎸 INSTRUMENTALIST <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🕺 DANCER <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🧠 MENTALIST <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🎤 RAPPER <span className="gold-sparkle">✦</span></span>
              <span className="marquee-node">🌟 CELEBRITY <span className="gold-sparkle">✦</span></span>
            </div>
          ))}
        </div>
      </div>

      {ready.categories ? (
        <div className="home-section-enter">
          <CategoryGrid counts={data.counts ?? {}} categories={categories} />
        </div>
      ) : (
        <CategorySkeleton />
      )}

      {ready.featured ? (
        <div className="home-section-enter">
          <FeaturedArtists artists={displayArtists} favorites={favorites} />
        </div>
      ) : (
        <FeaturedSkeleton />
      )}
    </div>
  );
}
