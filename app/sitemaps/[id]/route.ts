import { getSitemapShard, getSitemapShardIds } from "@/lib/seo/sitemapData";
import type { MetadataRoute } from "next";

export const revalidate = 86400;
export const dynamicParams = true;

const CACHE_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function generateStaticParams() {
  const ids = await getSitemapShardIds();
  return ids.map((id) => ({ id: `${id}.xml` }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.url)}</loc>`];
      if (entry.lastModified) {
        const lastModified = new Date(entry.lastModified);
        if (!Number.isNaN(lastModified.getTime())) {
          parts.push(`    <lastmod>${lastModified.toISOString()}</lastmod>`);
        }
      }
      if (entry.changeFrequency) {
        parts.push(`    <changefreq>${entry.changeFrequency}</changefreq>`);
      }
      if (entry.priority !== undefined) {
        parts.push(`    <priority>${entry.priority}</priority>`);
      }
      return `  <url>\n${parts.join("\n")}\n  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const shardId = id.endsWith(".xml") ? id.slice(0, -4) : id;

  if (!/^(pages|artists-\d+)$/.test(shardId)) {
    return new Response("Not Found", { status: 404 });
  }

  const entries = await getSitemapShard(shardId);
  return new Response(toXml(entries), { headers: CACHE_HEADERS });
}
