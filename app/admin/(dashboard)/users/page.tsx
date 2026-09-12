import { requireAdmin } from "@/lib/auth/requireAdmin";
import UsersManager from "@/components/admin/UsersManager";

export const dynamic = "force-dynamic";

// Admin-only page (extra server guard: staff can enter the shell but not this page).
export default async function AdminUsersPage() {
  await requireAdmin("/admin/users");
  return <UsersManager />;
}
