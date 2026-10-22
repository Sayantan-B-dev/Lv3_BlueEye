import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { connectToDatabase } from "@/lib/db/connect";
import Inquiry from "@/lib/models/Inquiry";
import { getErrorMessage, privateApiSuccess, privateApiError } from "@/lib/utils/apiResponse";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;
    if (!userEmail) {
      return privateApiError("Unauthorized", 401);
    }

    await connectToDatabase();
    
    // Find inquiries by user's email address
    const inquiries = await Inquiry.find({ clientEmail: userEmail })
      .sort({ createdAt: -1 })
      .lean();

    return privateApiSuccess(inquiries);
  } catch (error) {
    return privateApiError(getErrorMessage(error, "Failed to fetch user inquiries"), 500);
  }
}
