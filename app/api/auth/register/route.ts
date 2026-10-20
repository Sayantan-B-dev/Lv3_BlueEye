import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { sendVerificationEmail } from "@/lib/utils/email";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { setCache } from "@/lib/db/redis";
import { cacheConfig, pendingUserCacheKey } from "@/lib/config/cache";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { isEmail } from "@/lib/utils/requestValidation";
import { verifyTurnstile } from "@/lib/utils/turnstile";

export async function POST(request: Request) {
  const ipLimit = await rateLimit(`register:ip:${clientIp(request)}`, 3, 900, "fail-open");
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many registration attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfter) } }
    );
  }

  try {
    const { name, email, password, username, turnstileToken } =
      await request.json();

    const captcha = await verifyTurnstile(turnstileToken, clientIp(request));
    if (!captcha.ok) {
      return apiError("Security check failed. Please try again.", 400);
    }

    if (!email || !password || !username) {
      return apiError("Missing required fields", 400);
    }

    if (
      !isEmail(email) ||
      typeof username !== "string" ||
      typeof password !== "string" ||
      (name !== undefined && typeof name !== "string") ||
      username.length < 3 ||
      username.length > 40 ||
      password.length < 6 ||
      password.length > 128
    ) {
      return apiError("Invalid registration details", 400);
    }

    const emailLimit = await rateLimit(`register:email:${email.toLowerCase()}`, 5, 3600, "fail-open");
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many registration attempts for this email." },
        { status: 429, headers: { "Retry-After": String(emailLimit.retryAfter) } }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });

    if (existingUser) {
      if (existingUser.isVerified) {
        return apiError("User with this email or username already exists", 400);
      }
      // If the existing user is unverified, delete it to prevent blocking
      await User.deleteOne({ _id: existingUser._id });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const hashedPassword = await bcrypt.hash(password, 10);

    const pendingUserData = {
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires
    };

    // Save to Redis for 10 minutes
    const redisKey = pendingUserCacheKey(email);
    const cached = await setCache(redisKey, pendingUserData, cacheConfig.auth.pendingUserTtlSeconds);

    if (!cached) {
      // Fallback to unverified MongoDB user if Redis cache is not available
      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        verificationCode,
        verificationCodeExpires,
        isVerified: false,
        role: "user"
      });

      await sendVerificationEmail(newUser.email, verificationCode);
      return apiSuccess({ email: newUser.email }, "Verification code sent to your email (Fallback Mode)", 201);
    }

    await sendVerificationEmail(pendingUserData.email, verificationCode);

    return apiSuccess({ email: pendingUserData.email }, "Verification code sent to your email", 201);
  } catch (error: any) {
    return apiError(error.message || "Registration failed", 500);
  }
}
