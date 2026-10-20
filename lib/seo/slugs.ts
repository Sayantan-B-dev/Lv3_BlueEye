import { slugify } from "@/lib/utils/slugify";

/** Canonical lowercase hyphen path for a category. */
export function categoryPath(category: string): string {
  return `/category/${slugify(category)}`;
}

/** Canonical lowercase hyphen path for a city. */
export function cityPath(city: string): string {
  return `/city/${slugify(city)}`;
}

/** Canonical paginated path; page 1 stays on the clean URL. */
export function cityPagePath(city: string, page: number): string {
  return page <= 1 ? cityPath(city) : `${cityPath(city)}/page/${page}`;
}

export function categoryPagePath(category: string, page: number): string {
  return page <= 1 ? categoryPath(category) : `${categoryPath(category)}/page/${page}`;
}

export function artistPagePath(page: number): string {
  return page <= 1 ? "/artists" : `/artists/page/${page}`;
}

/** Canonical blog path; page 1 stays on the clean URL. */
export function blogPagePath(page: number, category?: string): string {
  const base = category ? `/blog/category/${slugify(category)}` : "/blog";
  return page <= 1 ? base : `${base}/page/${page}`;
}

/** Canonical events status path (lowercase slug segment). */
export function eventStatusPath(status: string): string {
  return `/events/status/${slugify(status)}`;
}

/** Map URL slug segment back to the DB category value. */
export function resolveCategorySlug(slug: string, categories: string[]): string {
  const decoded = decodeURIComponent(slug).trim();
  if (categories.includes(decoded)) return decoded;
  const normalized = slugify(decoded);
  const match = categories.find((c) => slugify(c) === normalized);
  return match ?? decoded;
}

/** Map URL slug segment back to the DB city value. */
export function resolveCitySlug(slug: string, cities: string[]): string {
  const decoded = decodeURIComponent(slug).trim();
  if (cities.includes(decoded)) return decoded;
  const normalized = slugify(decoded);
  const match = cities.find((c) => slugify(c) === normalized);
  return match ?? decoded;
}

/** True when the path segment is already a normalized SEO slug. */
export function isCanonicalSlug(segment: string): boolean {
  const decoded = decodeURIComponent(segment);
  return decoded === slugify(decoded);
}
