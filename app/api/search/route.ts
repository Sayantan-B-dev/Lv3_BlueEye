import { NextResponse } from "next/server";
import { searchArtists } from "@/lib/services/searchService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { boundedText, parsePositiveInt } from "@/lib/utils/requestValidation";

export async function GET(request: Request) {
  try {
    const limitResult = await rateLimit(`search:${clientIp(request)}`, 30, 60, "fail-open");
    if (!limitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please slow down." },
        { status: 429, headers: { "Retry-After": String(limitResult.retryAfter) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const q = boundedText(searchParams.get("q"), 80);
    const category = boundedText(searchParams.get("category"), 60);
    const city = boundedText(searchParams.get("city"), 60);
    const page = parsePositiveInt(searchParams.get("page"), 1, 50);
    const pageSize = parsePositiveInt(searchParams.get("limit"), 12, 24);

    if (q === null || category === null || city === null || page === null || pageSize === null) {
      return apiError("Invalid search parameters", 400);
    }

    if (!q) {
      return apiError("Search query 'q' is required", 400);
    }

    const data = await searchArtists(q, { category, city }, { page, limit: pageSize });
    return apiSuccess(data, "Success", 200, 60);
  } catch (error: any) {
    return apiError(error.message || "Failed to search artists", 500);
  }
}
