import { siteConfig } from "@/lib/config/site";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata = pageMetadata({
  title: "Book an Artist — Submit a Booking Enquiry for Weddings & Events",
  description: `Submit a booking enquiry for singers, DJs, comedians, and live performers. ${siteConfig.name} responds with pricing and availability within 24 hours.`,
  path: "/book-artist",
});

export default function BookArtistLayout({ children }: { children: React.ReactNode }) {
  return children;
}
