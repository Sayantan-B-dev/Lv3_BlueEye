import type { Metadata } from "next";
import { siteConfig } from "@/lib/config/site";

export function siteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const noIndexRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

export function pageMetadata(options: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  openGraphType?: "website" | "article";
  ogType?: "default" | "artist" | "category" | "city" | "event" | "blog";
  ogCategory?: string;
}): Metadata {
  const url = siteUrl(options.path);
  const image = options.image || siteConfig.ogImage;
  const dynamicOg = options.ogType || (options.image ? "default" : undefined);
  const ogUrl = dynamicOg
    ? siteUrl(`/og?title=${encodeURIComponent(options.title.slice(0, 120))}${options.description ? `&description=${encodeURIComponent(options.description.slice(0, 200))}` : ""}${options.image ? `&image=${encodeURIComponent(options.image)}&type=artist` : `&type=${options.ogType || "default"}`}${options.ogCategory ? `&category=${encodeURIComponent(options.ogCategory)}` : ""}`)
    : image;

  return {
    title: options.title,
    description: options.description,
    alternates: { canonical: url },
    ...(options.noIndex ? { robots: noIndexRobots } : {}),
    openGraph: {
      title: options.title,
      description: options.description,
      url,
      type: options.openGraphType ?? "website",
      locale: "en_IN",
      siteName: siteConfig.name,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: options.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: options.title,
      description: options.description,
      images: [ogUrl],
      ...(siteConfig.twitterHandle ? { creator: siteConfig.twitterHandle } : {}),
    },
  };
}

export function resolveMediaUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  const endpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;
  if (!endpoint) return undefined;
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${endpoint}/${normalized}`;
}

export function artistSummary(artist: {
  name: string;
  category?: string;
  about?: string | string[];
  location?: { city?: string };
}): string {
  const aboutText = Array.isArray(artist.about)
    ? artist.about.join(" ")
    : typeof artist.about === "string"
      ? artist.about
      : "";
  const fallback = `Book ${artist.name}${artist.category ? `, a ${artist.category}` : ""} for weddings, corporate events, and private parties in ${artist.location?.city || "India"} via ${siteConfig.name}.`;
  const text = (aboutText || fallback).replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

export function artistProfilePath(slug: string): string {
  return `/artists/${slug}`;
}
