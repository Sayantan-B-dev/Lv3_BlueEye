const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || "Blue Eye Entertainment";

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
}

export const siteConfig: SiteConfig = {
  name: brandName,
  shortName: process.env.NEXT_PUBLIC_BRAND_SHORT_NAME || brandName,
  description: `Book India's Top Artists - Singers, DJs, Comedians & more for your events via ${brandName}. Premium entertainment at your fingertips.`,
  longDescription: `${brandName} is India's leading platform for booking premium entertainment. From Bollywood singers and high-energy DJs to corporate comedians and live bands, we provide high-quality artist management services for weddings, corporate events, and private parties.`,
  url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
  ogImage: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/og.jpg`,
  author: `${brandName} Team`,
  mainKeywords: [
    "artist booking platform",
    "book bollywood singers",
    "wedding entertainment india",
    "hire djs for corporate events",
    "live music bands for hire",
    "premium event entertainment",
    "artist management agency",
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
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS,
};




