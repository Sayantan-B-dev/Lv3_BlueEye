import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

export async function POST(request: Request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }

    const toEmail = process.env.EMAIL_TO || "theblueeyeentertainment@gmail.com";

    const { error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [toEmail],
      subject: `✦ Privacy Inquiry from ${name}`,
      html: `
        <div style="font-family: 'Montserrat', sans-serif; background: #07090c; color: #e5e7eb; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #0f1218; border: 1px solid rgba(212,160,23,0.25); border-radius: 20px; padding: 40px;">
            <h2 style="color: #d4a017; margin: 0 0 24px;">New Privacy Inquiry</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; width: 30%;">Name</td><td style="padding: 8px 0; color: #fff; font-weight: 600;">${name}</td></tr>
              <tr><td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Email</td><td style="padding: 8px 0; color: #d4a017; border-top: 1px solid rgba(255,255,255,0.05);">${email}</td></tr>
            </table>
            <div style="background: rgba(212,160,23,0.05); border-left: 3px solid #d4a017; padding: 16px 20px; border-radius: 0 12px 12px 0; color: #d1d5db; line-height: 1.7;">
              ${message}
            </div>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ success: false, message: "Failed to send message" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact API error:", err);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
