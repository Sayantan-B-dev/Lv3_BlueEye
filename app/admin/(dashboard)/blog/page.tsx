"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`/api/admin/blog?page=${page}&limit=20`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setPosts(res.data.posts);
          setTotalPages(res.data.totalPages);
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  const deletePost = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      setPosts((prev) => prev.filter((p) => p._id !== id));
    }
  };

  const togglePublish = async (post: any) => {
    const res = await fetch(`/api/admin/blog/${post._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !post.published }),
    });
    const data = await res.json();
    if (data.success) {
      setPosts((prev) => prev.map((p) => (p._id === post._id ? { ...p, published: !p.published } : p)));
    }
  };

  if (loading) return <div className="fade-in"><p className="admin-subtitle">Loading posts...</p></div>;

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-10" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="admin-title">
            Blog <span className="text-gold">Manager</span>
          </h1>
          <p className="admin-subtitle">Create and manage blog posts, guides, and articles.</p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary" style={{ textDecoration: "none" }}>
          + New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="admin-table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p className="admin-subtitle">No blog posts yet. Create your first post!</p>
        </div>
      ) : (
        <div className="admin-table-container" style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Author</th>
                <th>Published</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post._id}>
                  <td style={{ fontWeight: 600, maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {post.title}
                  </td>
                  <td>{post.category || "—"}</td>
                  <td>
                    <span
                      className={`admin-badge ${post.published ? "badge-active" : "badge-draft"}`}
                      style={{
                        background: post.published ? "rgba(0,200,80,0.15)" : "rgba(255,255,255,0.08)",
                        color: post.published ? "#00c850" : "var(--text3)",
                        padding: "2px 10px",
                        borderRadius: "100px",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                      }}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text2)" }}>{post.author || "—"}</td>
                  <td style={{ color: "var(--text2)", fontSize: "0.85rem" }}>
                    {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-IN") : "—"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={() => togglePublish(post)}
                        className="btn-outline"
                        style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", cursor: "pointer" }}
                      >
                        {post.published ? "Unpublish" : "Publish"}
                      </button>
                      <Link
                        href={`/admin/blog/${post._id}/edit`}
                        className="btn-outline"
                        style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", textDecoration: "none" }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deletePost(post._id, post.title)}
                        className="btn-outline"
                        style={{ padding: "0.3rem 0.7rem", fontSize: "0.78rem", color: "#ff4444", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1.5rem" }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: `1px solid ${p === page ? "var(--gold)" : "var(--border)"}`,
                    background: p === page ? "var(--gold)" : "transparent",
                    color: p === page ? "#000" : "var(--text)",
                    fontWeight: p === page ? 800 : 500,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
