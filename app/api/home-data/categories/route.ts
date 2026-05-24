import { getHomePageData } from "@/lib/services/homeDataService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getHomePageData();
    return apiSuccess({ categories: data.categories, counts: data.counts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return apiError(message, 500);
  }
}
