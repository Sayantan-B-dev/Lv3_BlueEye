/**
 * ImageKit URL builder (safe in both server and client components).
 *
 * Adds ImageKit transformation parameters so the CDN — not the origin — resizes
 * and re-encodes images. Absolute ImageKit URLs get `?tr=…`; relative paths are
 * resolved against NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT.
 */
const ENDPOINT = (process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "").replace(/\/+$/, "");

export type ImageTransform = {
  width?: number;
  height?: number;
  quality?: number;
  format?: "auto" | "webp" | "avif";
};

export function ikUrl(src: string | null | undefined, opts: ImageTransform = {}): string {
  if (!src) return "";

  const { width, height, quality = 72, format = "auto" } = opts;
  const transform = [
    width ? `w-${Math.round(width)}` : "",
    height ? `h-${Math.round(height)}` : "",
    `q-${Math.round(quality)}`,
    `f-${format}`,
  ]
    .filter(Boolean)
    .join(",");

  if (/^https?:\/\//i.test(src)) {
    if (!/^https?:\/\/ik\.imagekit\.io\//i.test(src)) return src;
    if (src.includes("/tr:") || /[?&]tr=/.test(src)) return src;
    return `${src}${src.includes("?") ? "&" : "?"}tr=${transform}`;
  }

  if (!ENDPOINT) return src;

  const path = src.replace(/^\/+/, "");
  if (path.startsWith("tr:")) return `${ENDPOINT}/${path}`;
  return `${ENDPOINT}/tr:${transform}/${path}`;
}
