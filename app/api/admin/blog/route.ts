import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import BlogPost from "@/lib/models/BlogPost";
import { connectToDatabase } from "@/lib/db/connect";
import { slugify } from "@/lib/utils/slugify";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BlogPost.countDocuments(),
    ]);

    return apiSuccess({
      posts: JSON.parse(JSON.stringify(posts)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch blog posts", 500);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    await connectToDatabase();
    const body = await request.json();

    if (!body.title || !body.content) {
      return apiError("Title and content are required", 400);
    }

    const slug = body.slug || slugify(body.title);

    const existing = await BlogPost.findOne({ slug });
    if (existing) {
      return apiError("A post with this slug already exists", 409);
    }

    const post = await BlogPost.create({
      title: body.title,
      slug,
      excerpt: body.excerpt || body.content.slice(0, 200),
      content: body.content,
      coverImage: body.coverImage || "",
      category: body.category || "",
      tags: body.tags || [],
      author: body.author || "Blue Eye Entertainment Team",
      published: body.published !== false,
      publishedAt: body.published !== false ? new Date() : undefined,
      featured: body.featured || false,
    });

    return apiSuccess(JSON.parse(JSON.stringify(post)), "Blog post created", 201);
  } catch (error: any) {
    return apiError(error.message || "Failed to create post", 500);
  }
}
