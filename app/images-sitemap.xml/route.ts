import { connectToDatabase } from "@/lib/db/connect";
import Artist from "@/lib/models/Artist";
import Event from "@/lib/models/Event";
import { siteUrl } from "@/lib/seo/metadata";

export async function GET() {
  try {
    await connectToDatabase();

    const [artists, events] = await Promise.all([
      Artist.find(
        { "media.images.0": { $exists: true } },
        { slug: 1, name: 1, category: 1, "media.images": { $slice: 5 }, updatedAt: 1 }
      )
        .sort({ updatedAt: -1 })
        .limit(500)
        .lean(),
      Event.find(
        { coverImage: { $exists: true, $ne: "" } },
        { slug: 1, title: 1, coverImage: 1, updatedAt: 1 }
      )
        .sort({ updatedAt: -1 })
        .limit(500)
        .lean(),
    ]);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

    for (const artist of artists) {
      const url = siteUrl(`/artists/${artist.slug}`);
      xml += `\n  <url>
    <loc>${url}</loc>`;

      const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "";
      for (const img of (artist as any).media.images) {
        const src = img.startsWith("http") ? img : `${endpoint}/${img.startsWith("/") ? img.slice(1) : img}`;
        xml += `\n    <image:image>
      <image:loc>${src}</image:loc>
      <image:title>${escapeXml(artist.name)}${artist.category ? ` — ${escapeXml(artist.category)}` : ""}</image:title>
    </image:image>`;
      }
      xml += `\n  </url>`;
    }

    for (const event of events) {
      const url = siteUrl(`/events/${event.slug}`);
      xml += `\n  <url>
    <loc>${url}</loc>
    <image:image>
      <image:loc>${escapeXml((event as any).coverImage)}</image:loc>
      <image:title>${escapeXml(event.title)}</image:title>
    </image:image>
  </url>`;
    }

    xml += `\n</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Image sitemap error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
