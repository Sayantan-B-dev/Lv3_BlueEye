import { NextResponse } from "next/server";

const PRIVATE_CACHE_HEADERS: Record<string, string> = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Netlify-CDN-Cache-Control": "no-store",
};

export function apiSuccess(data: unknown, message: string = "Success", status: number = 200, cacheTTL?: number) {
  const headers: Record<string, string> = {};
  if (cacheTTL) {
    headers["Cache-Control"] = `public, max-age=${cacheTTL}, s-maxage=${cacheTTL}`;
  }
  return NextResponse.json({ success: true, message, data }, { status, headers });
}

export function apiError(message: string, status: number = 400, errors: unknown = null) {
  return NextResponse.json({ success: false, message, errors }, { status });
}

export function privateApiSuccess(data: unknown, message: string = "Success", status: number = 200) {
  return NextResponse.json(
    { success: true, message, data },
    { status, headers: PRIVATE_CACHE_HEADERS }
  );
}

export function privateApiError(message: string, status: number = 401, errors: unknown = null) {
  return NextResponse.json(
    { success: false, message, errors },
    { status, headers: PRIVATE_CACHE_HEADERS }
  );
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}
