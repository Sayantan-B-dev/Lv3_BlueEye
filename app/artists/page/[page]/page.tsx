import type { Metadata } from "next";
import ArtistsBrowseView from "@/components/artists/ArtistsBrowseView";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";
import { artistPagePath } from "@/lib/seo/slugs";
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
  params: Promise<{ page: string }>;
}): Promise<Metadata> {
  const { page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) return {};

  return pageMetadata({
    title: `Browse Artists — Page ${pageNumber} | ${siteConfig.name}`,
    description: `Discover and book verified singers, DJs, comedians, bands, and performers across India on ${siteConfig.name}.`,
    path: artistPagePath(pageNumber),
  });
}

export default async function PaginatedArtistsPage({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  const pageNumber = parsePage(page);
  if (!pageNumber) notFound();
  if (pageNumber === 1) redirect("/artists");

  return <ArtistsBrowseView page={pageNumber} />;
}
