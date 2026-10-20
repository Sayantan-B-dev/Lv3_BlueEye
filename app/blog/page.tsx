import type { Metadata } from "next";
import BlogListView from "@/components/blog/BlogListView";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Blog — Artist Booking Tips & Entertainment Guide",
  description: `Expert guides, tips, and insights about artist booking, event entertainment, and the Indian live performance industry from ${siteConfig.name}.`,
  path: "/blog",
});

export default function BlogPage() {
  return <BlogListView page={1} />;
}
