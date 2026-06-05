import { NextResponse } from "next/server";
import { searchArtists } from "@/lib/services/searchService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    if (!q) {
      return apiError("Search query 'q' is required", 400);
    }

    const data = await searchArtists(q, { category, city }, { page, limit });
    return apiSuccess(data, "Success", 200, 300);
  } catch (error: any) {
    return apiError(error.message || "Failed to search artists", 500);
  }
}
