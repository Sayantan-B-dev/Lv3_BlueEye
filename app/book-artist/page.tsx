import type { Metadata } from "next";
import { Suspense } from "react";
import EmailForm from "@/components/forms/EmailForm";
import { pageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = pageMetadata({
  title: "Book an Artist — Singers, DJs, Comedians & Performers",
  description:
    "Tell us about your event and we will match you with verified singers, DJs, comedians, bands and performers for weddings, corporate events and parties.",
  path: "/book-artist",
});

function BookArtistContent() {
  return (
    <div className="section-inner pt-nav flex min-h-[90vh] flex-col items-center justify-center">
      <EmailForm variant="booking" />
    </div>
  );
}

export default function BookArtistPage() {
  return (
    <Suspense fallback={<div className="section-inner pt-nav text-center">Loading form...</div>}>
      <BookArtistContent />
    </Suspense>
  );
}
