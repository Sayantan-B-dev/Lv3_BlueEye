import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBlogPosts, getDistinctBlogCategories } from "@/lib/services/blogService";
import { breadcrumbJsonLd } from "@/lib/seo/jsonld";
import { blogPagePath } from "@/lib/seo/slugs";
import { ikUrl } from "@/lib/utils/imagekit";

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type BlogPostListItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt?: string;
  category?: string;
  coverImage?: string;
  createdAt: string | Date;
  publishedAt?: string | Date;
};

export default async function BlogListView({
  page,
  category,
}: {
  page: number;
  category?: string;
}) {
  const currentPage = Math.max(1, page);
  const [result, categories] = await Promise.all([
    getBlogPosts({ page: currentPage, category }),
    getDistinctBlogCategories(),
  ]);

  const { posts, totalPages } = result as {
    posts: BlogPostListItem[];
    total: number;
    page: number;
    totalPages: number;
  };

  if (currentPage > 1 && currentPage > totalPages) notFound();

  const structuredData = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Blog", path: "/blog" },
  ]);

  return (
    <div
      className="section-inner"
      style={{
        padding: "clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)",
        paddingTop: "calc(var(--hdr-h) + 2rem)",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div className="section-label" style={{ justifyContent: "center" }}>Resources</div>
        <h1 className="section-title">
          Artist Booking <span>Blog & Guides</span>
        </h1>
        <p className="section-desc" style={{ maxWidth: "600px", margin: "0 auto" }}>
          Expert advice, booking tips, and insider guides to help you plan the perfect event entertainment.
        </p>
      </div>

      {categories.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            justifyContent: "center",
            marginBottom: "3rem",
          }}
        >
          <Link
            href="/blog"
            className="btn-outline"
            style={{
              padding: "0.4rem 1rem",
              fontSize: "0.82rem",
              borderRadius: "100px",
              textDecoration: "none",
              fontWeight: category ? 500 : 800,
              textTransform: "capitalize",
            }}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={blogPagePath(1, cat)}
              className="btn-outline"
              style={{
                padding: "0.4rem 1rem",
                fontSize: "0.82rem",
                borderRadius: "100px",
                textDecoration: "none",
                fontWeight: category === cat ? 800 : 500,
                textTransform: "capitalize",
              }}
            >
              {cat}
            </Link>
          ))}
        </div>
      )}

      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text2)" }}>
          <p>No blog posts yet. Check back soon for guides and tips!</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "2rem",
          }}
        >
          {posts.map((post) => (
            <article
              key={post._id}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                background: "var(--surface)",
              }}
            >
              <Link
                href={`/blog/${post.slug}`}
                prefetch={false}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                {post.coverImage && (
                  <div style={{ position: "relative", width: "100%", height: "200px", overflow: "hidden" }}>
                    <Image
                      src={ikUrl(post.coverImage, { width: 680, quality: 72 })}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 340px"
                      className="object-cover"
                      style={{ transition: "transform 0.3s ease" }}
                    />
                  </div>
                )}
                <div style={{ padding: "1.5rem" }}>
                  <div
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "center",
                      marginBottom: "0.75rem",
                      fontSize: "0.78rem",
                      color: "var(--muted)",
                    }}
                  >
                    {post.category && (
                      <span
                        style={{
                          background: "rgba(212, 160, 23, 0.1)",
                          color: "var(--gold)",
                          padding: "0.15rem 0.6rem",
                          borderRadius: "4px",
                          fontWeight: 600,
                        }}
                      >
                        {post.category}
                      </span>
                    )}
                    <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                  </div>
                  <h2
                    style={{
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      marginBottom: "0.5rem",
                      lineHeight: 1.4,
                      fontFamily: "var(--font-primary)",
                    }}
                  >
                    {post.title}
                  </h2>
                  <p style={{ fontSize: "0.88rem", color: "var(--text2)", lineHeight: 1.6 }}>
                    {post.excerpt}
                  </p>
                  <div
                    style={{
                      marginTop: "1rem",
                      color: "var(--gold)",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                    }}
                  >
                    Read More →
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.75rem",
            marginTop: "3rem",
            flexWrap: "wrap",
          }}
        >
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={blogPagePath(p, category)}
              className="btn-outline"
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: p === currentPage ? 800 : 500,
                background: p === currentPage ? "var(--gold)" : "transparent",
                color: p === currentPage ? "#000" : "var(--text)",
                borderColor: p === currentPage ? "var(--gold)" : "var(--border)",
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
