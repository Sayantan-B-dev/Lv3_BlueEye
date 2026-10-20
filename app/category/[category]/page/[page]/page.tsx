import type { Metadata } from "next";
import { getDistinctCategories } from "@/lib/services/searchService";
import CategoryArtistsView from "@/components/category/CategoryArtistsView";
import { pageMetadata } from "@/lib/seo/metadata";
import { categoryMetaDescription } from "@/lib/seo/content";
import { categoryPagePath, categoryPath, resolveCategorySlug } from "@/lib/seo/slugs";
import { notFound, redirect } from "next/navigation";

export const revalidate = 3600;

function parsePage(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const page = Number.parseInt(raw, 10);
  return page >= 1 && page <= 100 ? page : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}): Promise<Metadata> {
  const { category, page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) return {};

  const categories = await getDistinctCategories();
  const label = resolveCategorySlug(category, categories);
  if (!categories.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();

  return pageMetadata({
    title: `${label} Artists for Hire — Page ${pageNumber} — Weddings & Events`,
    description: categoryMetaDescription(label),
    path: categoryPagePath(label, pageNumber),
    ogType: "category",
    ogCategory: label,
  });
}

export default async function PaginatedCategoryPage({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}) {
  const { category, page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) notFound();

  const categories = await getDistinctCategories();
  const label = resolveCategorySlug(category, categories);
  if (!categories.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();

  if (pageNumber === 1) redirect(categoryPath(label));

  return <CategoryArtistsView category={label} page={pageNumber} />;
}
