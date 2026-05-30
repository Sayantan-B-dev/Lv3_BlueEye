import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { sendBulkDeleteOtpEmail } from "@/lib/utils/email";

// In-memory OTP store — good enough for single-process admin use
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST — generate OTP and email it to admin
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    const { count, resource } = await request.json();
    const adminEmail = process.env.EMAIL_TO || "sayantanbharati611@gmail.com";
    const otp = generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(adminEmail, { otp, expiresAt });

    const result = await sendBulkDeleteOtpEmail(otp, count, resource);
    if (!result.success) {
      return apiError("Failed to send OTP email. Please try again.", 500);
    }

    return apiSuccess({ sent: true }, "OTP sent to admin email");
  } catch (err: any) {
    return apiError(err.message || "Failed to generate OTP", 500);
  }
}

// PUT — verify OTP
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any)?.role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    const { otp } = await request.json();
    const adminEmail = process.env.EMAIL_TO || "sayantanbharati611@gmail.com";
    const stored = otpStore.get(adminEmail);

    if (!stored) {
      return apiError("No pending OTP. Please request a new one.", 400);
    }
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(adminEmail);
      return apiError("OTP has expired. Please request a new one.", 400);
    }
    if (stored.otp !== otp.trim()) {
      return apiError("Invalid OTP. Please try again.", 400);
    }

    otpStore.delete(adminEmail);
    return apiSuccess({ verified: true }, "OTP verified");
  } catch (err: any) {
    return apiError(err.message || "Failed to verify OTP", 500);
  }
}
