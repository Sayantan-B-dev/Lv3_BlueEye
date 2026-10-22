import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo/metadata";
import { buildRobotsRules } from "@/lib/seo/robotsPolicy";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: buildRobotsRules(),
    sitemap: [siteUrl("/sitemap.xml"), siteUrl("/images-sitemap.xml")],
  };
}
