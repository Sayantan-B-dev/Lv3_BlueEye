import type { Metadata } from "next";
import ArtistsBrowseView from "@/components/artists/ArtistsBrowseView";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Browse Artists – Singers, DJs, Comedians & More",
  description: `Discover and book verified singers, DJs, comedians, bands, and performers across India on ${siteConfig.name}.`,
  path: "/artists",
});

export default function ArtistsPage() {
  return <ArtistsBrowseView page={1} />;
}
