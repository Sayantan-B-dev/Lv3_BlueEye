import { getHomePageData } from "@/lib/services/homeDataService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export const revalidate = 300;

export async function GET() {
  try {
    return apiSuccess(await getHomePageData(), "Success", 200, 300);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch home data";
    return apiError(message, 500);
  }
}
