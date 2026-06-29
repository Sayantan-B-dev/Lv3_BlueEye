import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPostBySlug, getBlogPostsForSitemap } from "@/lib/services/blogService";
import { siteConfig } from "@/lib/config/site";
import { pageMetadata, siteUrl } from "@/lib/seo/metadata";
import { breadcrumbJsonLd, articleJsonLd } from "@/lib/seo/jsonld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await getBlogPostsForSitemap();
  return posts.map((p) => ({ slug: p.slug }));
}

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
    ogType: "blog",
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
      className="section-inner blog-single"
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

      <nav aria-label="Breadcrumb" className="blog-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/blog">Blog</Link>
        <span>/</span>
        <span className="current">{post.title}</span>
      </nav>

      <div className="blog-header">
        <div className="blog-meta">
          {post.category && (
            <span className="blog-category-badge">{post.category}</span>
          )}
          <span className="blog-meta-sep" />
          <span>{formatDate(post.publishedAt || post.createdAt)}</span>
          {post.author && (
            <>
              <span className="blog-meta-sep" />
              <span>By {post.author}</span>
            </>
          )}
        </div>
        <h1 className="blog-title">{post.title}</h1>
        <p className="blog-excerpt">{post.excerpt}</p>
      </div>

      {post.coverImage && (
        <div className="blog-cover">
          <Image src={post.coverImage} alt={post.title} fill sizes="(max-width: 768px) 100vw, 800px" className="object-cover" />
        </div>
      )}

      <div className="blog-content blog-body" dangerouslySetInnerHTML={{ __html: post.content }} />

      {post.tags && post.tags.length > 0 && (
        <div className="blog-tags">
          {post.tags.map((tag: string) => (
            <span key={tag} className="blog-tag">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="blog-cta">
        <p>Ready to book amazing talent for your event?</p>
        <Link href="/book-artist" className="btn-primary">
          Book an Artist Now ✦
        </Link>
      </div>

      <div className="blog-footer">
        <Link href="/blog" className="btn-outline">
          ← Back to Blog
        </Link>
      </div>
    </article>
  );
}
