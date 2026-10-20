import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { isEmail } from "@/lib/utils/requestValidation";

export async function POST(req: Request) {
  const limit = await rateLimit(`reset:ip:${clientIp(req)}`, 5, 900, "fail-open");
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const { email, token, password } = await req.json();

    if (!email || !token || !password) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    if (!isEmail(email) || typeof token !== "string" || !/^\d{6}$/.test(token)) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }

    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      return NextResponse.json({ success: false, message: "Password must be 6-128 characters" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: token, // Here 'token' is the OTP from frontend
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Invalid or expired OTP" }, { status: 400 });
    }

    // Update password
    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });

  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
