import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import Inquiry from "@/lib/models/Inquiry";
import { inquirySchemaValidation } from "@/lib/utils/validators";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { sendInquiryEmail } from "@/lib/utils/email";
import { checkCooldown, updateCooldown } from "@/lib/auth/cooldown";
import { clientIp, rateLimit } from "@/lib/utils/rateLimit";
import { verifyTurnstile } from "@/lib/utils/turnstile";

// PUBLIC: Submit a new inquiry
export async function POST(request: Request) {
  const limit = await rateLimit(`inquiry:${clientIp(request)}`, 3, 600, "fail-closed");
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: limit.unavailable ? "Service temporarily unavailable" : "Too many requests" },
      { status: limit.unavailable ? 503 : 429, headers: { "Retry-After": String(limit.retryAfter) } }
    );
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return apiError("Unauthorized", 401);
    }

    const cooldown = await checkCooldown();
    if (!cooldown.allowed) {
      return NextResponse.json({
        success: false,
        message: `Please wait ${cooldown.remainingMin} min before sending another inquiry.`,
        cooldown: cooldown.remainingMs,
      }, { status: 429 });
    }

    await connectToDatabase();
    const { turnstileToken, ...body } = await request.json();

    const captcha = await verifyTurnstile(turnstileToken, clientIp(request));
    if (!captcha.ok) {
      return apiError("Security check failed. Please try again.", 400);
    }

    const result = inquirySchemaValidation.safeParse(body);
    
    if (!result.success) {
      return apiError(result.error.issues[0].message, 400, result.error.issues);
    }
    
    const inquiry = await Inquiry.create(result.data);
    
    await updateCooldown();

    // Send email notification (don't await to avoid delaying the response)
    sendInquiryEmail(result.data).catch(err => console.error("Email notify fail:", err));

    return apiSuccess(inquiry, "Inquiry submitted successfully", 201);
  } catch (error: any) {
    return apiError(error.message || "Failed to submit inquiry", 500);
  }
}

// ADMIN ONLY: List all inquiries
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    await connectToDatabase();
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean();
    return apiSuccess(inquiries);
  } catch (error: any) {
    return apiError(error.message || "Failed to fetch inquiries", 500);
  }
}
