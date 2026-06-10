import { NextResponse } from "next/server";
import { getArtists, deleteArtist, createArtist } from "@/lib/services/artistService";
import { searchArtists } from "@/lib/services/searchService";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { z } from "zod";

const createArtistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  category_tag: z.string().optional(),
  booking_link: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
  }).optional(),
  about: z.array(z.string()).optional(),
  performance: z.object({
    duration_minutes: z.object({ min: z.number(), max: z.number() }).optional(),
    team_members: z.object({ min: z.number(), max: z.number() }).optional(),
    genres: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
  }).optional(),
  media: z.object({
    images: z.array(z.string()).optional(),
    videos: z.array(z.string()).optional(),
  }).optional(),
  faq: z.array(z.any()).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const category = searchParams.get("category") || undefined;
    const city = searchParams.get("city") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const featured = searchParams.has("featured") ? searchParams.get("featured") === "true" : undefined;
    const missing = searchParams.get("missing") || undefined;
    const sort = searchParams.get("sort") || undefined;

    if (q) {
      const { artists, pagination } = await searchArtists(q, { category, city }, { page, limit, sort });
      return apiSuccess({
        artists,
        total: pagination.total,
        page: pagination.page,
        totalPages: pagination.totalPages
      });
    }

    const data = await getArtists({ category, city, page, limit, featured, missing, sort });
    return apiSuccess(data);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch artists", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();
    const parsed = createArtistSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400);
    }

    const artist = await createArtist(parsed.data);
    return apiSuccess(artist, "Artist created", 201);
  } catch (error: any) {
    return apiError(error.message || "Failed to create artist", 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    const { ids } = await request.json();
    if (!ids || !Array.isArray(ids)) {
      return apiError("Invalid IDs provided", 400);
    }

    const results = await Promise.all(ids.map(id => deleteArtist(id)));
    return apiSuccess({ deletedCount: results.length });
  } catch (error: any) {
    return apiError(error.message || "Failed to delete artists", 500);
  }
}
