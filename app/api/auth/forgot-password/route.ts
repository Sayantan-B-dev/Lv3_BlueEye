import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { sendResetPasswordEmail } from "@/lib/utils/email";
import { siteConfig } from "@/lib/config/site";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { isEmail } from "@/lib/utils/requestValidation";

// Handle forgot password request

export async function POST(req: Request) {
  const ipLimit = await rateLimit(`forgot:ip:${clientIp(req)}`, 3, 900, "fail-open");
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
    );
  }

  try {
    const { email } = await req.json();

    if (!isEmail(email)) {
      return NextResponse.json({ success: false, message: "A valid email is required" }, { status: 400 });
    }

    const emailLimit = await rateLimit(`forgot:email:${email.toLowerCase()}`, 3, 3600, "fail-open");
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({ success: true, message: "If an account with that email exists, a reset link has been sent." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration (15 minutes)
    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    // Send email
    await sendResetPasswordEmail(user.email, otp);

    return NextResponse.json({ 
      success: true, 
      message: "If an account with that email exists, a 6-digit OTP has been sent." 
    });

  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
