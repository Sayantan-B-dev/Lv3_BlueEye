import { requireAdmin } from "@/lib/auth/requireAdmin";
import BlogForm from "./BlogForm";

export const dynamic = "force-dynamic";

export default async function NewBlogPostPage() {
  await requireAdmin();

  return (
    <div className="fade-in">
      <div className="mb-10">
        <h1 className="admin-title">
          New <span className="text-gold">Blog Post</span>
        </h1>
        <p className="admin-subtitle">Write a new article, guide, or industry insight.</p>
      </div>

      <div className="admin-table-container" style={{ padding: "2rem", marginTop: "1rem" }}>
        <BlogForm mode="create" />
      </div>
    </div>
  );
}
