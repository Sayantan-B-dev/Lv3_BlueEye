import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Playfair_Display, Outfit, Limelight, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ScrollReveal from "@/components/ui/ScrollReveal";
import AuthProvider from "@/components/auth/AuthProvider";
import FavoritesProvider from "@/components/providers/FavoritesProvider";
import { WebVitals } from "@/components/analytics/WebVitals";

import AppChrome from "@/components/layout/AppChrome";
import { LoadingProvider } from "@/lib/context/LoadingContext";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const limelight = Limelight({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-limelight",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

import { siteConfig } from "@/lib/config/site";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.shortName,
  title: {
    default: `${siteConfig.name} | Book India's Top Artists`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.mainKeywords,
  authors: [{ name: siteConfig.author, url: siteConfig.url }],
  creator: siteConfig.author,
  category: "entertainment",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteConfig.url,
    title: {
      default: `${siteConfig.name} | Book India's Top Artists`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.longDescription || siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} Open Graph Image`,
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | Book India's Top Artists`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitterHandle,
  },
  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: `/site.webmanifest`,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    other: {
      "msvalidate.01": process.env.BING_SITE_VERIFICATION || "",
    },
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-IN"
      data-theme="dark"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${outfit.variable} ${limelight.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#d4a017" />
        <link rel="preload" as="image" href="/eye.webp" type="image/webp" fetchPriority="high" />
        <link rel="alternate" hrefLang="en" href={siteConfig.url} />
        <link rel="alternate" hrefLang="x-default" href={siteConfig.url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([organizationJsonLd(), websiteJsonLd()]),
          }}
        />
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <WebVitals />
        <LoadingProvider>
          <AppChrome />
          <Suspense fallback={null}>
            <ScrollReveal />
          </Suspense>
          <AuthProvider>
            <FavoritesProvider>
              <Navbar />
              <main className="site-main flex-grow">{children}</main>
              <Footer />
            </FavoritesProvider>
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
