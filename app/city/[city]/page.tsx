import type { Metadata } from "next";
import { getDistinctCities } from "@/lib/services/searchService";
import CityArtistsView from "@/components/city/CityArtistsView";
import { pageMetadata } from "@/lib/seo/metadata";
import { cityMetaDescription } from "@/lib/seo/content";
import { cityPath, resolveCitySlug } from "@/lib/seo/slugs";
import { slugify } from "@/lib/utils/slugify";
import { notFound } from "next/navigation";

export const revalidate = 3600;

export async function generateStaticParams() {
  const cities = await getDistinctCities();
  return cities.map((c) => ({ city: slugify(c) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city } = await params;
  const cities = await getDistinctCities();
  const label = resolveCitySlug(city, cities);
  if (!cities.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();
  return pageMetadata({
    title: `Book Artists in ${label} — Singers, DJs & Performers for Events`,
    description: cityMetaDescription(label),
    path: cityPath(label),
    ogType: "city",
  });
}

export default async function CityArtistsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city } = await params;
  const cities = await getDistinctCities();
  const label = resolveCitySlug(city, cities);
  if (!cities.some((c) => c.toLowerCase() === label.toLowerCase())) notFound();

  return <CityArtistsView city={label} page={1} />;
}
