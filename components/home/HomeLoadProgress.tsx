"use client";

export type HomeSectionKey = "ambient" | "hero" | "categories" | "featured";

const SECTION_META: { key: HomeSectionKey; label: string }[] = [
  { key: "ambient", label: "Ambient visuals" },
  { key: "hero", label: "Hero spotlight" },
  { key: "categories", label: "Categories" },
  { key: "featured", label: "Featured artists" },
];

export default function HomeLoadProgress({
  progress,
  ready,
  visible,
}: {
  progress: number;
  ready: Record<HomeSectionKey, boolean>;
  visible: boolean;
}) {
  if (!visible) return null;

  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className="home-load-progress" role="status" aria-live="polite" aria-label={`Loading home page ${clamped} percent`}>
      <div className="home-load-progress-card">
        <div className="home-load-progress-top">
          <span className="home-load-progress-label">Preparing your experience</span>
          <span className="home-load-progress-value">{clamped}%</span>
        </div>
        <div className="home-load-progress-track">
          <div className="home-load-progress-fill" style={{ width: `${clamped}%` }} />
        </div>
        <ul className="home-load-progress-sections">
          {SECTION_META.map(({ key, label }) => (
            <li key={key} className={ready[key] ? "is-done" : ""}>
              <span className="home-load-progress-dot" aria-hidden />
              <span>{label}</span>
              <span className="home-load-progress-status">{ready[key] ? "Ready" : "Loading…"}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
