import { connectToDatabase } from "@/lib/db/connect";
import Artist from "@/lib/models/Artist";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session.user as any).role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "images";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: Record<string, any>[] = [];
    if (type === "images") {
      conditions.push({
        $or: [
          { "media.images": { $exists: false } },
          { "media.images": { $size: 0 } }
        ]
      });
      conditions.push({
        "media.videos": { $exists: true, $not: { $size: 0 } }
      });
    } else if (type === "videos") {
      conditions.push({
        $or: [
          { "media.videos": { $exists: false } },
          { "media.videos": { $size: 0 } }
        ]
      });
      conditions.push({
        "media.images": { $exists: true, $not: { $size: 0 } }
      });
    } else if (type === "both") {
      conditions.push({
        $or: [
          { "media.images": { $exists: false } },
          { "media.images": { $size: 0 } }
        ]
      });
      conditions.push({
        $or: [
          { "media.videos": { $exists: false } },
          { "media.videos": { $size: 0 } }
        ]
      });
    }

    const filter = conditions.length > 0 ? { $and: conditions } : {};
    const artists = await Artist.find(filter, { name: 1, category: 1, slug: 1, _id: 1, "media.images": 1, "media.videos": 1 })
      .sort({ name: 1 })
      .lean();

    return apiSuccess(artists);
  } catch (error: unknown) {
    return apiError(error instanceof Error ? error.message : "Failed to fetch artists", 500);
  }
}
