import { suggestArtists } from "@/lib/services/searchService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;
    const limit = parseInt(searchParams.get("limit") || "8", 10);

    if (!q) {
      return apiSuccess({ artists: [] });
    }

    const artists = await suggestArtists(q, { category, city }, limit);
    return apiSuccess({ artists });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load suggestions";
    return apiError(message, 500);
  }
}
