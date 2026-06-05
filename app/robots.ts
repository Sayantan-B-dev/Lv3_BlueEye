import { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";
import { siteUrl } from "@/lib/seo/metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/_next/image"],
        disallow: [
          "/admin/",
          "/api/",
          "/login",
          "/profile",
          "/reset-password",
        ],
      },
    ],
    sitemap: [siteUrl("/sitemap.xml"), siteUrl("/images-sitemap.xml")],
    host: siteConfig.url.replace(/\/$/, ""),
  };
}
