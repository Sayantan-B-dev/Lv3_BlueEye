import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// ADMIN ONLY: list users with search + role filter (for staff promotion).
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return apiError("Unauthorized", 401);
    }
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const role = searchParams.get("role") || "";
    const filter: any = {};
    if (["user", "staff", "admin"].includes(role)) filter.role = role;
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { email: rx }, { username: rx }];
    }
    await connectToDatabase();
    const users = await User.find(filter)
      .select("name username email role isVerified createdAt")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const counts: Record<string, number> = {};
    for (const r of ["user", "staff", "admin"] as const) {
      counts[r] = await User.countDocuments({ role: r });
    }
    return apiSuccess({ users, counts });
  } catch (error: any) {
    return apiError(error.message || "Failed to list users", 500);
  }
}

// ADMIN ONLY: promote/demote between user <-> staff.
// Admin accounts are untouchable here — only the DB owner can grant admin.
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return apiError("Unauthorized", 401);
    }
    const { userId, role } = await request.json();
    if (!userId || !["user", "staff"].includes(role)) {
      return apiError("Only user <-> staff transitions are allowed here", 400);
    }
    await connectToDatabase();
    const target: any = await User.findById(userId);
    if (!target) return apiError("User not found", 404);
    if (target.role === "admin") {
      return apiError("Admin accounts cannot be changed from the panel", 403);
    }
    if (target.role === role) return apiSuccess(target, "No change needed");
    target.role = role;
    await target.save();
    return apiSuccess(
      { _id: target._id, email: target.email, role: target.role },
      role === "staff" ? "Promoted to staff" : "Demoted to user"
    );
  } catch (error: any) {
    return apiError(error.message || "Failed to update role", 500);
  }
}
