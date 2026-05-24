import { getHomePageData } from "@/lib/services/homeDataService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getHomePageData();
    return apiSuccess({ randomArtists: data.randomArtists });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch artists";
    return apiError(message, 500);
  }
}
