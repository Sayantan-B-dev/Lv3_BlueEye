import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { sendVerificationEmail } from "@/lib/utils/email";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { setCache } from "@/lib/db/redis";
import { cacheConfig, pendingUserCacheKey } from "@/lib/config/cache";

export async function POST(request: Request) {
  try {
    const { name, email, password, username } = await request.json();

    if (!email || !password || !username) {
      return apiError("Missing required fields", 400);
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
