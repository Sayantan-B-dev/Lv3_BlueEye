function resolveBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env && !env.includes("localhost") && !env.includes("127.0.0.1")) return env;
  return "https://blueeyeentertainment.in";
}

const baseUrl = resolveBaseUrl();
const brandName = process.env.NEXT_PUBLIC_BRAND_NAME;

export interface SiteConfig {
  name: string;
  shortName: string;
  description: string;
  longDescription: string;
  url: string;
  ogImage: string;
  author: string;
  mainKeywords: string[];
  links: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
  };
  twitterHandle?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  address2?: string;
}

export const siteConfig: SiteConfig = {
  name: brandName || "Blue Eye Entertainment",
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || brandName || "Blue Eye Entertainment",
  description: `Book India's Top Artists - Singers, DJs, Comedians & more for your events via ${brandName || "Blue Eye Entertainment"}. Premium entertainment at your fingertips.`,
  longDescription: `${brandName || "Blue Eye Entertainment"} is India's leading platform for booking premium entertainment. From Bollywood singers and high-energy DJs to corporate comedians and live bands, we provide high-quality artist management services for weddings, corporate events, and private parties.`,
  url: baseUrl,
  ogImage: `${baseUrl}/icon.png`,
  author: `${brandName || "Blue Eye Entertainment"} Team`,
  mainKeywords: [
    "blue eye entertainment",
    "artist booking india",
    "book bollywood singers",
    "hire celebrity for wedding",
    "indian artist booking agency",
    "wedding entertainment india",
    "book stand up comedians",
    "hire djs for corporate events",
    "live music bands for hire",
    "artist management agency india",
    "book performers for private parties",
  ],
  links: {
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL,
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL,
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL,
  },
  twitterHandle: process.env.NEXT_PUBLIC_TWITTER_HANDLE,
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
  contactPhone: process.env.NEXT_PUBLIC_CONTACT_PHONE,
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS_1,
  address2: process.env.NEXT_PUBLIC_CONTACT_ADDRESS_2,
};




