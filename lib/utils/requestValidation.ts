/** Parsing helpers for public query strings. Return null when input is invalid. */

export function parsePositiveInt(
  raw: string | null | undefined,
  fallback: number,
  max: number
): number | null {
  if (raw === null || raw === undefined || raw === "") return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < 1 || value > max) return null;
  return value;
}

export function boundedText(
  raw: string | null | undefined,
  maxLength: number
): string | undefined | null {
  if (raw === null || raw === undefined) return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  if (value.length > maxLength) return null;
  return value;
}

export function isEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
