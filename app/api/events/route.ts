import { NextResponse, type NextRequest } from "next/server";
import { getEvents, getDistinctEventCategories } from "@/lib/services/eventService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get("status") || undefined;
    const category = searchParams.get("category") || undefined;
    const featured = searchParams.get("featured") === "true" ? true : undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const [result, categories] = await Promise.all([
      getEvents({ status, category, featured, page, limit }),
      getDistinctEventCategories(),
    ]);

    return NextResponse.json({ ...result, categories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
