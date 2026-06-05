"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BlogForm from "../../new/BlogForm";

export default function EditBlogPostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/blog/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPost(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="fade-in"><p className="admin-subtitle">Loading post...</p></div>;
  if (!post) return <div className="fade-in"><p className="admin-subtitle">Post not found.</p></div>;

  return (
    <div className="fade-in">
      <div className="mb-10">
        <h1 className="admin-title">
          Edit <span className="text-gold">Blog Post</span>
        </h1>
        <p className="admin-subtitle">Update your article content and settings.</p>
      </div>

      <div className="admin-table-container" style={{ padding: "2rem", marginTop: "1rem" }}>
        <BlogForm key={post._id} mode="edit" initialData={post} />
      </div>
    </div>
  );
}
