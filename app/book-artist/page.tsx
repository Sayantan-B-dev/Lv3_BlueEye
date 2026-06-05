"use client";

import { Suspense } from "react";
import EmailForm from "@/components/forms/EmailForm";

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
