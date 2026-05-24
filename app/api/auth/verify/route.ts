import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import User from "@/lib/models/User";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getCache, invalidateCache } from "@/lib/db/redis";
import { pendingUserCacheKey } from "@/lib/config/cache";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return apiError("Email and code are required", 400);
    }

    await connectToDatabase();

    // 1. Try to read from Redis
    const redisKey = pendingUserCacheKey(email);
    const pendingUser = await getCache<any>(redisKey);

    if (pendingUser) {
      // Validate code and expiration
      if (pendingUser.verificationCode !== code) {
        return apiError("Invalid or expired verification code", 400);
      }

      if (new Date(pendingUser.verificationCodeExpires) <= new Date()) {
        return apiError("Verification code has expired", 400);
      }

      // Check one last time if a verified user registered in the meantime
      const existingUser = await User.findOne({
        $or: [{ email: email.toLowerCase() }, { username: pendingUser.username.toLowerCase() }]
      });

      if (existingUser && existingUser.isVerified) {
        return apiError("User with this email or username already exists", 400);
      }

      // If there's an unverified duplicate, delete it first
      if (existingUser) {
        await User.deleteOne({ _id: existingUser._id });
      }

      // Create the verified user in MongoDB!
      await User.create({
        name: pendingUser.name,
        email: pendingUser.email,
        username: pendingUser.username,
        password: pendingUser.password,
        isVerified: true,
        role: "user"
      });

      // Clear the Redis cache
      await invalidateCache(redisKey);

      return apiSuccess(null, "Email verified successfully. You can now log in.");
    }

    // 2. Fallback: Check MongoDB (for users created in fallback mode or if Redis was not used)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      verificationCode: code,
      verificationCodeExpires: { $gt: new Date() }
    });

    if (!user) {
      return apiError("Invalid or expired verification code", 400);
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return apiSuccess(null, "Email verified successfully. You can now log in.");
  } catch (error: any) {
    return apiError(error.message || "Verification failed", 500);
  }
}
