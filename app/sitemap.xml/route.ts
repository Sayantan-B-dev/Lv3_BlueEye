import { getSitemapShardIds } from "@/lib/seo/sitemapData";
import { siteUrl } from "@/lib/seo/metadata";

export const dynamic = "force-static";
export const revalidate = 86400;

const CACHE_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export async function GET() {
  const shardIds = await getSitemapShardIds();

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${shardIds
  .map((id) => `  <sitemap><loc>${siteUrl(`/sitemaps/${id}.xml`)}</loc></sitemap>`)
  .join("\n")}
</sitemapindex>`;

  return new Response(body, { headers: CACHE_HEADERS });
}
