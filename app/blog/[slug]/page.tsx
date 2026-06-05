import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug } from "@/lib/services/blogService";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
    image: post.coverImage,
    openGraphType: "article",
  });
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) notFound();

  const structuredData = [
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.title, path: `/blog/${slug}` },
    ]),
    articleJsonLd({
      title: post.title,
      description: post.excerpt,
      url: siteUrl(`/blog/${slug}`),
      image: post.coverImage,
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt,
      author: post.author,
    }),
  ];

  return (
    <article
      className="section-inner"
      style={{
        padding: "clamp(4rem, 8vw, 7rem) clamp(1rem, 4vw, 2.5rem)",
        paddingTop: "calc(var(--hdr-h) + 2rem)",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div
        style={{
          fontSize: "0.8rem",
          color: "var(--muted,#9ca3af)",
          display: "flex",
          gap: "0.4rem",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <Link href="/" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          Home
        </Link>
        <span>/</span>
        <Link href="/blog" style={{ color: "var(--gold,#d4a017)", textDecoration: "none" }}>
          Blog
        </Link>
        <span>/</span>
        <span>{post.title}</span>
      </div>

      <header style={{ marginBottom: "2.5rem" }}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            marginBottom: "1rem",
            fontSize: "0.82rem",
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
          {post.author && <span>By {post.author}</span>}
        </div>
        <h1 className="section-title" style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)" }}>
          {post.title}
        </h1>
        <p
          style={{
            fontSize: "1.05rem",
            color: "var(--text2)",
            lineHeight: 1.7,
            marginTop: "1rem",
          }}
        >
          {post.excerpt}
        </p>
      </header>

      {post.coverImage && (
        <div style={{ marginBottom: "2.5rem", borderRadius: "12px", overflow: "hidden" }}>
          <img
            src={post.coverImage}
            alt={post.title}
            style={{ width: "100%", height: "auto", maxHeight: "450px", objectFit: "cover" }}
          />
        </div>
      )}

      <div
        className="blog-content"
        style={{
          color: "var(--text2)",
          lineHeight: 1.9,
          fontSize: "1rem",
        }}
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {post.tags && post.tags.length > 0 && (
        <div
          style={{
            marginTop: "3rem",
            paddingTop: "2rem",
            borderTop: "1px solid var(--border)",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              style={{
                padding: "0.3rem 0.8rem",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "100px",
                fontSize: "0.8rem",
                color: "var(--text2)",
              }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "3rem",
          textAlign: "center",
          padding: "2rem",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p style={{ color: "var(--text2)", marginBottom: "1rem" }}>
          Ready to book amazing talent for your event?
        </p>
        <Link href="/book-artist" className="btn-primary">
          Book an Artist Now ✦
        </Link>
      </div>

      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <Link href="/blog" className="btn-outline">
          ← Back to Blog
        </Link>
      </div>
    </article>
  );
}
