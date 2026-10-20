import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CategoryCityArtistsView from "@/components/category/CategoryCityArtistsView";
import { getCategoryCityCounts } from "@/lib/services/searchService";
import { pageMetadata } from "@/lib/seo/metadata";
import { comboMetaDescription, pluralizeCategory } from "@/lib/seo/content";
import { slugify } from "@/lib/utils/slugify";

export const revalidate = 3600;

type Combo = { category: string; city: string; count: number };

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

export async function generateStaticParams() {
  const combos = await getCombos();
  return combos.map(({ category, city }) => ({
    category: slugify(category),
    city: slugify(city),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}): Promise<Metadata> {
  const { category, city } = await params;
  const combo = findCombo(await getCombos(), category, city);
  if (!combo) notFound();
  return pageMetadata({
    title: `Hire ${pluralizeCategory(combo.category)} in ${combo.city} — Book ${combo.category} Artists for Events`,
    description: comboMetaDescription(combo.category, combo.city),
    path: `/category/${category}/${city}`,
    ogType: "category",
    ogCategory: combo.category,
  });
}

export default async function CategoryCityArtistsPage({
  params,
}: {
  params: Promise<{ category: string; city: string }>;
}) {
  const { category, city } = await params;
  return <CategoryCityArtistsView category={category} city={city} page={1} />;
}
