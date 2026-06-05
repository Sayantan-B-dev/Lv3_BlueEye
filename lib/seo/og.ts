import { siteUrl } from "@/lib/seo/metadata";

export function ogImageUrl(options: {
  title: string;
  description?: string;
  image?: string;
  type?: "default" | "artist" | "category" | "city" | "event" | "blog";
  category?: string;
}): string {
  const params = new URLSearchParams();
  params.set("title", options.title.slice(0, 120));
  if (options.description) params.set("description", options.description.slice(0, 200));
  if (options.image) params.set("image", options.image);
  if (options.type) params.set("type", options.type);
  if (options.category) params.set("category", options.category);
  return siteUrl(`/og?${params.toString()}`);
}
