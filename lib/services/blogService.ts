import BlogPost from "@/lib/models/BlogPost";
import { connectToDatabase } from "@/lib/db/connect";
import { slugify } from "@/lib/utils/slugify";

export async function getBlogPosts(params: {
  page?: number;
  limit?: number;
  category?: string;
} = {}) {
  await connectToDatabase();

  const filter: Record<string, unknown> = { published: true };
  if (params.category) filter.category = params.category;

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, params.limit || 12);
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    BlogPost.countDocuments(filter),
  ]);

  return JSON.parse(JSON.stringify({
    posts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }));
}

export async function getBlogPostBySlug(slug: string) {
  await connectToDatabase();
  const post = await BlogPost.findOne({ slug, published: true }).lean();
  if (!post) return null;
  return JSON.parse(JSON.stringify(post));
}

export async function getDistinctBlogCategories() {
  await connectToDatabase();
  const categories = await BlogPost.distinct("category", { published: true });
  return categories.filter(Boolean) as string[];
}

export async function getBlogPostsForSitemap(max = 100) {
  await connectToDatabase();
  const posts = await BlogPost.find(
    { published: true },
    { slug: 1, updatedAt: 1 }
  )
    .sort({ publishedAt: -1 })
    .limit(max)
    .lean();
  return JSON.parse(JSON.stringify(posts)) as { slug: string; updatedAt?: string }[];
}

export async function createBlogPost(data: {
  title: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
  author?: string;
}) {
  await connectToDatabase();
  const slug = slugify(data.title);
  const post = await BlogPost.create({
    ...data,
    slug,
    publishedAt: new Date(),
  });
  return JSON.parse(JSON.stringify(post));
}
