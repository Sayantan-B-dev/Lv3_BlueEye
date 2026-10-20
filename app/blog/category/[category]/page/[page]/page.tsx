import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BlogListView from "@/components/blog/BlogListView";
import { getDistinctBlogCategories } from "@/lib/services/blogService";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { blogPagePath } from "@/lib/seo/slugs";
import { slugify } from "@/lib/utils/slugify";

export const revalidate = 3600;

function parsePage(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const page = Number.parseInt(raw, 10);
  return page >= 1 && page <= 100 ? page : null;
}

async function resolveCategory(slug: string): Promise<string | null> {
  const categories = await getDistinctBlogCategories();
  return categories.find((category) => slugify(category) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}): Promise<Metadata> {
  const { category, page } = await params;
  const pageNumber = parsePage(page);
  const label = await resolveCategory(category);
  if (!pageNumber || !label) return {};

  return pageMetadata({
    title: `${label} — Blog — Page ${pageNumber}`,
    description: `Expert ${label.toLowerCase()} guides and insights about artist booking and event entertainment from ${siteConfig.name}.`,
    path: blogPagePath(pageNumber, label),
  });
}

export default async function PaginatedBlogCategoryPage({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}) {
  const { category, page } = await params;
  const pageNumber = parsePage(page);
  const label = await resolveCategory(category);
  if (!pageNumber || !label) notFound();
  if (pageNumber === 1) redirect(blogPagePath(1, label));

  return <BlogListView page={pageNumber} category={label} />;
}
