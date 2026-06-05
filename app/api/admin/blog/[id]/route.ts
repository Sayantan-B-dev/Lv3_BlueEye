import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import BlogPost from "@/lib/models/BlogPost";
import { connectToDatabase } from "@/lib/db/connect";
import { slugify } from "@/lib/utils/slugify";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    await connectToDatabase();
    const { id } = await params;
    const post = await BlogPost.findById(id).lean();
    if (!post) return apiError("Post not found", 404);

    return apiSuccess(JSON.parse(JSON.stringify(post)));
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch post", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();

    const update: Record<string, unknown> = {};
    if (body.title) {
      update.title = body.title;
      update.slug = slugify(body.title);
    }
    if (body.excerpt !== undefined) update.excerpt = body.excerpt;
    if (body.content !== undefined) update.content = body.content;
    if (body.coverImage !== undefined) update.coverImage = body.coverImage;
    if (body.category !== undefined) update.category = body.category;
    if (body.tags !== undefined) update.tags = body.tags;
    if (body.author !== undefined) update.author = body.author;
    if (body.published !== undefined) {
      update.published = body.published;
      if (body.published) {
        update.publishedAt = new Date();
      }
    }
    if (body.featured !== undefined) update.featured = body.featured;

    const post = await BlogPost.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!post) return apiError("Post not found", 404);

    return apiSuccess(JSON.parse(JSON.stringify(post)), "Post updated");
  } catch (error: any) {
    return apiError(error.message || "Failed to update post", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return apiError("Unauthorized", 401);

    await connectToDatabase();
    const { id } = await params;
    const post = await BlogPost.findByIdAndDelete(id).lean();
    if (!post) return apiError("Post not found", 404);

    return apiSuccess(null, "Post deleted");
  } catch (error: any) {
    return apiError(error.message || "Failed to delete post", 500);
  }
}
