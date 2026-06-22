import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

const YT_REGEX = /(?:v\/|v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { url, isVideo } = await req.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "No URL provided" }, { status: 400 });
    }

    if (isVideo) {
      const match = url.match(YT_REGEX);
      if (!match) {
        return NextResponse.json({ success: false, error: "Invalid YouTube URL format" });
      }
      const videoId = match[1];
      const thumbRes = await fetch(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      if (!thumbRes.ok) {
        return NextResponse.json({ success: false, error: "YouTube video not found or inaccessible" });
      }
      return NextResponse.json({ success: true, videoId });
    }

    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BlueEyeBot/1.0)" },
    });
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Failed to fetch image — server returned " + response.status });
    }
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({
        success: false,
        error: "URL does not point directly to an image (got " + contentType + ")",
      });
    }
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Validation failed" });
  }
}
