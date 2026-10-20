import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogListView from "@/components/blog/BlogListView";
import { getDistinctBlogCategories } from "@/lib/services/blogService";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { blogPagePath } from "@/lib/seo/slugs";
import { slugify } from "@/lib/utils/slugify";

export const revalidate = 3600;

async function resolveCategory(slug: string): Promise<string | null> {
  const categories = await getDistinctBlogCategories();
  return categories.find((category) => slugify(category) === slug) ?? null;
}

export async function generateStaticParams() {
  const categories = await getDistinctBlogCategories();
  return categories.map((category) => ({ category: slugify(category) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const label = await resolveCategory(category);
  if (!label) return {};

  return pageMetadata({
    title: `${label} — Blog`,
    description: `Expert ${label.toLowerCase()} guides and insights about artist booking and event entertainment from ${siteConfig.name}.`,
    path: blogPagePath(1, label),
  });
}

export default async function BlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const label = await resolveCategory(category);
  if (!label) notFound();

  return <BlogListView page={1} category={label} />;
}
