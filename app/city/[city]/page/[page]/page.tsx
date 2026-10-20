import type { Metadata } from "next";
import { getDistinctCities } from "@/lib/services/searchService";
import CityArtistsView from "@/components/city/CityArtistsView";
import { pageMetadata } from "@/lib/seo/metadata";
import { cityMetaDescription } from "@/lib/seo/content";
import { cityPagePath, cityPath, resolveCitySlug } from "@/lib/seo/slugs";
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
  params: Promise<{ city: string; page: string }>;
}): Promise<Metadata> {
  const { city, page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) return {};

  const cities = await getDistinctCities();
  const label = resolveCitySlug(city, cities);
  if (!cities.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();

  return pageMetadata({
    title: `Book Artists in ${label} — Page ${pageNumber} — Singers, DJs & Performers`,
    description: cityMetaDescription(label),
    path: cityPagePath(label, pageNumber),
    ogType: "city",
  });
}

export default async function PaginatedCityPage({
  params,
}: {
  params: Promise<{ city: string; page: string }>;
}) {
  const { city, page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) notFound();

  const cities = await getDistinctCities();
  const label = resolveCitySlug(city, cities);
  if (!cities.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();

  if (pageNumber === 1) redirect(cityPath(label));

  return <CityArtistsView city={label} page={pageNumber} />;
}
