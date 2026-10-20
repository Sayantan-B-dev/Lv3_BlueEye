import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import CategoryCityArtistsView from "@/components/category/CategoryCityArtistsView";
import { getCategoryCityCounts } from "@/lib/services/searchService";
import { pageMetadata } from "@/lib/seo/metadata";
import { comboMetaDescription, pluralizeCategory } from "@/lib/seo/content";
import { slugify } from "@/lib/utils/slugify";

export const revalidate = 3600;

type Combo = { category: string; city: string; count: number };

function parsePage(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const page = Number.parseInt(raw, 10);
  return page >= 1 && page <= 100 ? page : null;
}

async function getCombos(): Promise<Combo[]> {
  return (await getCategoryCityCounts(3).catch(() => [])) as Combo[];
}

function findCombo(combos: Combo[], categorySlug: string, citySlug: string): Combo | undefined {
  return combos.find(
    (combo) =>
      slugify(combo.category) === categorySlug.toLowerCase() &&
      slugify(combo.city) === citySlug.toLowerCase()
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string; page: string }>;
}): Promise<Metadata> {
  const { category, city, page } = await params;
  const pageNumber = parsePage(page);
  const combo = findCombo(await getCombos(), category, city);
  if (!pageNumber || !combo) return {};

  return pageMetadata({
    title: `Hire ${pluralizeCategory(combo.category)} in ${combo.city} — Page ${pageNumber}`,
    description: comboMetaDescription(combo.category, combo.city),
    path: `/category/${category}/${city}/page/${pageNumber}`,
    ogType: "category",
    ogCategory: combo.category,
  });
}

export default async function PaginatedCategoryCityPage({
  params,
}: {
  params: Promise<{ category: string; city: string; page: string }>;
}) {
  const { category, city, page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) notFound();
  if (pageNumber === 1) redirect(`/category/${category}/${city}`);

  const combo = findCombo(await getCombos(), category, city);
  if (!combo) notFound();

  return <CategoryCityArtistsView category={category} city={city} page={pageNumber} />;
}
