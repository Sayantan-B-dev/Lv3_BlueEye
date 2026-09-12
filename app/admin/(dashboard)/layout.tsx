import AdminSidebar from "@/components/admin/AdminSidebar";
import { requireStaff } from "@/lib/auth/requireStaff";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admins get the full shell; staff only see ticketing links (sidebar filters
  // by role, and every non-ticketing API still enforces admin).
  const session = await requireStaff();
  const role = ((session.user as { role?: string }).role || "user") as "admin" | "staff" | "user";

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="flex min-h-screen" style={{ paddingTop: 'var(--hdr-h)' }}>
        <AdminSidebar role={role} />

        {/* Main Content */}
        <main className="admin-main">
          <div className="full-width-container">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
