import { slugify } from "@/lib/utils/slugify";

/** Canonical lowercase hyphen path for a category. */
export function categoryPath(category: string): string {
  return `/category/${slugify(category)}`;
}

/** Canonical lowercase hyphen path for a city. */
export function cityPath(city: string): string {
  return `/city/${slugify(city)}`;
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
