import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";

/** Allows admin + staff (venue check-in crew). Pure users go to switch-account. */
export async function requireStaff(callbackPath = "/admin/ticketing/checkin") {
  const session = await getServerSession(authOptions);
  const callbackUrl = encodeURIComponent(callbackPath);

  if (!session) {
    redirect(`/login?callbackUrl=${callbackUrl}`);
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "staff") {
    redirect(`/switch-account?callbackUrl=${callbackUrl}`);
  }

  return session;
}
