import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import BlogListView from "@/components/blog/BlogListView";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { blogPagePath } from "@/lib/seo/slugs";

export const revalidate = 3600;

function parsePage(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const page = Number.parseInt(raw, 10);
  return page >= 1 && page <= 100 ? page : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) return {};

  return pageMetadata({
    title: `Blog — Page ${pageNumber}`,
    description: `Expert guides, tips, and insights about artist booking and event entertainment from ${siteConfig.name}.`,
    path: blogPagePath(pageNumber),
  });
}

export default async function PaginatedBlogPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) notFound();
  if (pageNumber === 1) redirect("/blog");

  return <BlogListView page={pageNumber} />;
}
