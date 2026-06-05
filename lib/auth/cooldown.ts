import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";

const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export type CooldownResult =
  | { allowed: true }
  | { allowed: false; remainingMs: number; remainingMin: number };

export async function checkCooldown(): Promise<CooldownResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { allowed: false, remainingMs: COOLDOWN_MS, remainingMin: 30 };
  }

  await connectToDatabase();
  const user = await User.findOne({ email: session.user.email }).select("lastSubmissionAt");

  if (!user || !user.lastSubmissionAt) {
    return { allowed: true };
  }

  const elapsed = Date.now() - new Date(user.lastSubmissionAt).getTime();
  if (elapsed >= COOLDOWN_MS) {
    return { allowed: true };
  }

  const remainingMs = COOLDOWN_MS - elapsed;
  return { allowed: false, remainingMs, remainingMin: Math.ceil(remainingMs / 60000) };
}

export async function updateCooldown(): Promise<void> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return;

  await connectToDatabase();
  await User.findOneAndUpdate(
    { email: session.user.email },
    { lastSubmissionAt: new Date() },
    { upsert: true }
  );
}
