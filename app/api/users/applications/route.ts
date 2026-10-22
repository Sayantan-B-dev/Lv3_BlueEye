import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import ArtistApplicant from "@/lib/models/ArtistApplicant";
import User from "@/lib/models/User";
import { getErrorMessage, privateApiSuccess, privateApiError } from "@/lib/utils/apiResponse";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser?.email) return privateApiError("Unauthorized", 401);

    await connectToDatabase();

    const sessionEmail = sessionUser.email.toLowerCase();
    const sessionUserId = sessionUser.id;

    // Resolve the real DB user ID
    let dbUserId: string | null = null;
    if (sessionUserId && mongoose.Types.ObjectId.isValid(sessionUserId)) {
      dbUserId = sessionUserId;
    }
    if (!dbUserId) {
      const dbUser = await User.findOne({ email: sessionEmail }).select("_id").lean();
      if (dbUser) dbUserId = dbUser._id.toString();
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const orConditions: Record<string, unknown>[] = [
      { applicantEmail: sessionEmail },
    ];
    if (dbUserId) {
      orConditions.push({ userId: dbUserId });
    }

    const filter = {
      $and: [
        { $or: orConditions },
        {
          $or: [
            { status: { $ne: "rejected" } },
            { rejectedAt: { $gte: sevenDaysAgo } },
          ],
        },
      ],
    };

    const applications = await ArtistApplicant.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return privateApiSuccess(applications);
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to fetch applications"), 500);
  }
}
