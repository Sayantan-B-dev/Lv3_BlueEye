import type { Metadata } from "next";
import { getDistinctCategories } from "@/lib/services/searchService";
import CategoryArtistsView from "@/components/category/CategoryArtistsView";
import { pageMetadata } from "@/lib/seo/metadata";
import { categoryMetaDescription } from "@/lib/seo/content";
import { categoryPath, resolveCategorySlug } from "@/lib/seo/slugs";
import { slugify } from "@/lib/utils/slugify";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await getDistinctCategories();
  return categories.map((c) => ({ category: slugify(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categories = await getDistinctCategories();
  const label = resolveCategorySlug(category, categories);
  if (!categories.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();
  return pageMetadata({
    title: `${label} Artists for Hire — Weddings, Corporate & Events in India`,
    description: categoryMetaDescription(label),
    path: categoryPath(label),
    ogType: "category",
    ogCategory: label,
  });
}

export default async function CategoryArtistsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categories = await getDistinctCategories();
  const label = resolveCategorySlug(category, categories);
  if (!categories.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();

  return <CategoryArtistsView category={label} page={1} />;
}
