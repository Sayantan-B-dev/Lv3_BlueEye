const LEGACY_KEYS = ["page", "category", "city", "status"] as const;

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePage(value: string | null): number {
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number.parseInt(value, 10);
  return page >= 1 && page <= 100 ? page : 1;
}

function withPage(base: string, page: number): string {
  return page > 1 ? `${base}/page/${page}` : base;
}

function cleanPath(pathname: string): string {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
}

function slugValue(value: string | null): string | null {
  if (!value) return null;
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }
  const normalized = slugify(decoded);
  return normalized || null;
}

/**
 * Maps legacy query-string listings to their canonical static routes.
 * Returns `null` when the request has no legacy query parameters.
 */
export function legacyRedirectPath(
  pathname: string,
  params: URLSearchParams
): string | null {
  const hasLegacyQuery = LEGACY_KEYS.some((key) => params.has(key));
  if (!hasLegacyQuery) return null;

  const path = cleanPath(pathname);
  const page = parsePage(params.get("page"));
  const category = slugValue(params.get("category"));
  const city = slugValue(params.get("city"));
  const status = slugValue(params.get("status"));

  if (path === "/artists") {
    if (category && city) return withPage(`/category/${category}/${city}`, page);
    if (category) return withPage(`/category/${category}`, page);
    if (city) return withPage(`/city/${city}`, page);
    return withPage("/artists", page);
  }

  if (path === "/blog") {
    return withPage("/blog", page);
  }

  if (path === "/events") {
    return status ? `/events/status/${status}` : null;
  }

  const cityMatch = /^\/city\/([^/]+)$/.exec(path);
  if (cityMatch) {
    return withPage(`/city/${slugValue(cityMatch[1]) || cityMatch[1]}`, page);
  }

  const categoryMatch = /^\/category\/([^/]+)$/.exec(path);
  if (categoryMatch) {
    return withPage(
      `/category/${slugValue(categoryMatch[1]) || categoryMatch[1]}`,
      page
    );
  }

  const categoryCityMatch = /^\/category\/([^/]+)\/([^/]+)$/.exec(path);
  if (categoryCityMatch && categoryCityMatch[2] !== "page") {
    const categorySlug = slugValue(categoryCityMatch[1]) || categoryCityMatch[1];
    const citySlug = slugValue(categoryCityMatch[2]) || categoryCityMatch[2];
    return withPage(`/category/${categorySlug}/${citySlug}`, page);
  }

  const blogCategoryMatch = /^\/blog\/category\/([^/]+)$/.exec(path);
  if (blogCategoryMatch) {
    const categorySlug = slugValue(blogCategoryMatch[1]) || blogCategoryMatch[1];
    return withPage(`/blog/category/${categorySlug}`, page);
  }

  return null;
}
