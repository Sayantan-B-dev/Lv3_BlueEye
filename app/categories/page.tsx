import type { Metadata } from "next";
import { getDistinctCategories, getCategoryCounts } from "@/lib/services/searchService";
import CategoryGrid from "@/components/home/CategoryGrid";
import { pageMetadata } from "@/lib/seo/metadata";
import { siteConfig } from "@/lib/config/site";
import { categoryPath } from "@/lib/seo/slugs";
import Link from "next/link";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = pageMetadata({
  title: "Browse All Artist Categories — Book by Genre & Performance Type",
  description: `Explore all artist categories on ${siteConfig.name}: singers, DJs, comedians, bands, dancers, anchors, and more for weddings, corporate events, and parties across India.`,
  path: "/categories",
});

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([
    getDistinctCategories(),
    getCategoryCounts(),
  ]);

  const structuredData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
  ]);

  return (
    <div className="section-inner" style={{ paddingTop: "clamp(4rem, 8vw, 7rem)", paddingBottom: "4rem" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <nav aria-label="Breadcrumb" style={{ fontSize: "0.8rem", color: "var(--muted,#9ca3af)", display: "flex", gap: "0.4rem", alignItems: "center", marginBottom: "1.5rem" }}>
        <Link href="/" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>Home</Link>
        <span>/</span>
        <span>Categories</span>
      </nav>

      <div style={{ marginBottom: "2rem" }}>
        <p className="section-label">Categories</p>
        <h1 className="section-title">Browse Artists by <span>Category</span></h1>
        <p className="section-desc">
          Discover and book performers across {categories.length} categories — from Bollywood singers and DJs to stand-up comedians and live bands.
        </p>
      </div>

      <CategoryGrid categories={categories} counts={counts} />
    </div>
  );
}
