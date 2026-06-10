import { NextResponse } from "next/server";
import ImageKit, { toFile } from "@imagekit/nodejs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { updateArtist, getArtistById } from "@/lib/services/artistService";

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { url, folder, artistId, isVideo } = await req.json();

    if (!url) {
      return NextResponse.json({ success: false, error: "No URL provided" }, { status: 400 });
    }

    if (!artistId) {
      return NextResponse.json({ success: false, error: "No artistId provided" }, { status: 400 });
    }

    if (isVideo) {
      const artist = await getArtistById(artistId);
      if (!artist) {
        return NextResponse.json({ success: false, error: "Artist not found" }, { status: 404 });
      }
      const currentVideos = artist.media?.videos || [];
      await updateArtist(artistId, { media: { ...artist.media, videos: [...currentVideos, url] } });
      return NextResponse.json({ success: true, message: "Video URL saved" });
    }

    // Download the image
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ success: false, error: "Failed to download image" }, { status: 502 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/").pop() || "jpg";
    const fileName = `${Date.now()}.${ext}`;

    const uploadResponse = await imagekit.files.upload({
      file: await toFile(buffer, fileName),
      fileName,
      folder: folder || "/uploads",
      useUniqueFileName: true,
    });

    const artist = await getArtistById(artistId);
    if (!artist) {
      return NextResponse.json({ success: false, error: "Artist not found" }, { status: 404 });
    }
    const currentImages = artist.media?.images || [];
    await updateArtist(artistId, { media: { ...artist.media, images: [...currentImages, uploadResponse.filePath] } });

    return NextResponse.json({
      success: true,
      filePath: uploadResponse.filePath,
      url: uploadResponse.url,
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Upload failed" }, { status: 500 });
  }
}
