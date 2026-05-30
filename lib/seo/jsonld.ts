import { siteConfig } from "@/lib/config/site";
import { artistProfilePath, resolveMediaUrl, siteUrl } from "@/lib/seo/metadata";

export function organizationJsonLd() {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    description: siteConfig.description,
    sameAs: Object.values(siteConfig.links).filter(Boolean),
  };

  if (siteConfig.contactEmail) {
    schema.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: siteConfig.contactEmail,
      ...(siteConfig.contactPhone ? { telephone: siteConfig.contactPhone } : {}),
      areaServed: "IN",
      availableLanguage: ["English", "Hindi"],
    };
  }

  if (siteConfig.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressCountry: "IN",
    };
  }

  return schema;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}#website`,
    name: siteConfig.name,
    alternateName: "BlueEye Entertainment",
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@type": "Organization", "@id": `${siteConfig.url}#organization`, name: siteConfig.name, url: siteConfig.url },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function artistJsonLd(artist: {
  name: string;
  slug: string;
  category?: string;
  about?: string | string[];
  location?: { city?: string; state?: string; country?: string };
  media?: { images?: string[] };
  performance?: { genres?: string[] };
}) {
  const url = siteUrl(artistProfilePath(artist.slug));
  const image = resolveMediaUrl(artist.media?.images?.[0]);
  const description = Array.isArray(artist.about)
    ? artist.about.join(" ")
    : typeof artist.about === "string"
      ? artist.about
      : `Book ${artist.name} for events across India.`;

  return {
    "@context": "https://schema.org",
    "@type": "PerformingGroup",
    name: artist.name,
    url,
    ...(image ? { image } : {}),
    description,
    ...(artist.category ? { genre: artist.category } : {}),
    ...(artist.performance?.genres?.length
      ? { knowsAbout: artist.performance.genres }
      : {}),
    areaServed: {
      "@type": "Place",
      name: [artist.location?.city, artist.location?.state, artist.location?.country || "India"]
        .filter(Boolean)
        .join(", "),
    },
    parentOrganization: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function eventJsonLd(event: {
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  startDate: string | Date;
  endDate?: string | Date;
  coverImage?: string;
  venue?: { name?: string; city?: string };
  status?: string;
}) {
  const url = siteUrl(`/events/${event.slug}`);
  const description =
    event.shortDescription ||
    (event.description ? event.description.slice(0, 200) : undefined);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url,
    ...(description ? { description } : {}),
    startDate: new Date(event.startDate).toISOString(),
    ...(event.endDate ? { endDate: new Date(event.endDate).toISOString() } : {}),
    ...(event.coverImage ? { image: event.coverImage } : {}),
    eventStatus: event.status === "Cancelled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    organizer: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    ...(event.venue?.name || event.venue?.city
      ? {
        location: {
          "@type": "Place",
          name: event.venue.name || event.venue.city,
          ...(event.venue.city
            ? { address: { "@type": "PostalAddress", addressLocality: event.venue.city } }
            : {}),
        },
      }
      : {}),
  };
}

export function localBusinessJsonLd() {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "@id": `${siteConfig.url}#localbusiness`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    image: `${siteConfig.url}/icon.png`,
    description: siteConfig.longDescription || siteConfig.description,
    priceRange: "₹₹₹",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    sameAs: Object.values(siteConfig.links).filter(Boolean),
  };

  if (siteConfig.contactEmail) {
    schema.email = siteConfig.contactEmail;
  }
  if (siteConfig.contactPhone) {
    schema.telephone = siteConfig.contactPhone;
  }
  if (siteConfig.address) {
    schema.address = {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address,
      addressCountry: "IN",
    };
  }

  return schema;
}
