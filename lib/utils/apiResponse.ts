import { NextResponse } from "next/server";

export function apiSuccess(data: any, message: string = "Success", status: number = 200, cacheTTL?: number) {
  const headers: Record<string, string> = {};
  if (cacheTTL) {
    headers["Cache-Control"] = `public, max-age=${cacheTTL}, s-maxage=${cacheTTL}`;
  }
  return NextResponse.json({ success: true, message, data }, { status, headers });
}

export function apiError(message: string, status: number = 400, errors: any = null) {
  return NextResponse.json({ success: false, message, errors }, { status });
}
