import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

// Helper to prevent 403 sandbox error when using Resend's free/onboarding tier
function getRecipientEmail(originalEmail: string): string {
  const allowedEmail = process.env.EMAIL_TO || "sayantanbharati611@gmail.com";
  if (originalEmail.toLowerCase().trim() !== allowedEmail.toLowerCase().trim()) {
    // console.log(`\n==================================================`);
    // console.log(`[Resend Sandbox Bypass] Redirecting email:`);
    // console.log(`- Original Recipient: ${originalEmail}`);
    // console.log(`- Redirected To: ${allowedEmail}`);
    // console.log(`==================================================\n`);
    return allowedEmail;
  }
  return originalEmail;
}

// Base template layout for premium emails
function getLuxuryTemplate(title: string, bodyContent: string) {
  return `
    <div style="font-family: 'Montserrat', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #07090c; color: #e5e7eb; padding: 50px 20px; line-height: 1.75; font-size: 15px;">
      <div style="max-width: 580px; margin: 0 auto; background: #0f1218; border: 1px solid rgba(212, 160, 23, 0.25); border-radius: 20px; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.65);">
        <!-- Luxury Branding Header -->
        <div style="padding: 40px 40px 30px 40px; text-align: center; border-bottom: 1px solid rgba(255, 255, 255, 0.05); background: linear-gradient(180deg, #131720 0%, #0f1218 100%);">
          <span style="font-size: 2.4rem; font-weight: 900; letter-spacing: 0.25em; color: #d4a017; text-transform: uppercase; display: inline-block;">BlueEye</span>
          <div style="font-size: 0.65rem; color: #9ca3af; letter-spacing: 0.45em; text-transform: uppercase; margin-top: 8px; font-weight: 700;">Exclusive Artists & Events</div>
        </div>
        
        <!-- Elegant Body Content -->
        <div style="padding: 40px 40px 30px 40px;">
          <h2 style="font-size: 1.5rem; font-weight: 800; color: #d4a017; margin-top: 0; margin-bottom: 24px; letter-spacing: 0.02em;">${title}</h2>
          ${bodyContent}
        </div>
        
        <!-- Footer -->
        <div style="padding: 30px 40px; background: #0b0d12; border-top: 1px solid rgba(255, 255, 255, 0.04); text-align: center; font-size: 0.8rem; color: #6b7280;">
          <p style="margin: 0 0 8px 0; font-weight: 600;">This is an automated communication from the BlueEye Platform.</p>
          <p style="margin: 0; font-size: 0.75rem;">© ${new Date().getFullYear()} BlueEye Entertainment. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

export async function sendInquiryEmail(data: {
  artistName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  eventDate?: string;
  eventType: string;
  message?: string;
}) {
  const toEmail = process.env.EMAIL_TO || "info@BlueEye.in";

  try {
    const htmlContent = getLuxuryTemplate(
      "New Artist Booking Inquiry",
      `
      <p style="margin: 0 0 20px 0;">You have received a new professional booking inquiry from the platform.</p>
      
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(212, 160, 23, 0.15); border-radius: 12px; padding: 24px; margin-bottom: 30px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; width: 40%;">Target Artist</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700;">${data.artistName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Client Name</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700; border-top: 1px solid rgba(255,255,255,0.05);">${data.clientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Email Address</td>
            <td style="padding: 8px 0; color: #d4a017; font-weight: 600; border-top: 1px solid rgba(255,255,255,0.05);">${data.clientEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Contact Number</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05);">${data.clientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Event Type</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05);">${data.eventType}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Proposed Date</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05);">${data.eventDate || "TBA"}</td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 0 0 10px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">Client Message</p>
      <div style="background: rgba(212, 160, 23, 0.05); border-left: 3px solid #d4a017; padding: 20px; border-radius: 0 12px 12px 0; font-style: italic; color: #d1d5db; margin-bottom: 20px;">
        "${data.message || "No custom message provided."}"
      </div>
      `
    );

    const { data: resData, error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [toEmail],
      subject: `✦ New Artist Inquiry: ${data.artistName} from ${data.clientName}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Resend Error:", error);
      return { success: false, error };
    }

    return { success: true, data: resData };
  } catch (err) {
    console.error("Email Service Error:", err);
    return { success: false, error: err };
  }
}

export async function sendVerificationEmail(email: string, code: string) {
  try {
    const htmlContent = getLuxuryTemplate(
      "Verify Your Account",
      `
      <p style="margin: 0 0 24px 0; color: #d1d5db; text-align: center;">Thank you for registering on BlueEye. Please use the verification code below to activate your account. This code is valid for 10 minutes.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 2.8rem; font-weight: 800; color: #d4a017; letter-spacing: 0.4em; background: rgba(212,160,23,0.08); padding: 20px 10px; border-radius: 12px; border: 1px dashed rgba(212,160,23,0.4); display: inline-block; width: 80%; text-shadow: 0 0 10px rgba(212,160,23,0.2);">
          ${code}
        </div>
      </div>
      
      <p style="margin: 30px 0 0 0; text-align: center; color: #9ca3af; font-size: 0.8rem;">If you did not initiate this request, please safely disregard this email.</p>
      `
    );

    const recipient = getRecipientEmail(email);
    // console.log(`\n🔑 [Verification Code Bypass]`);
    // console.log(`- Original Email: ${email}`);
    // console.log(`- Code: ${code}\n`);

    const { data: resData, error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [recipient],
      subject: "✦ Verify your BlueEye Account",
      html: htmlContent,
    });
    if (error) throw error;
    return { success: true, data: resData };
  } catch (err) {
    console.error("Verification email fail:", err);
    return { success: false, error: err };
  }
}

export async function sendResetPasswordEmail(email: string, otp: string) {
  try {
    const htmlContent = getLuxuryTemplate(
      "Reset Your Password",
      `
      <p style="margin: 0 0 24px 0; color: #d1d5db; text-align: center;">We received a request to reset your password. Use the verification OTP below to finalize the process. This code will expire in 15 minutes.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 2.8rem; font-weight: 800; color: #d4a017; letter-spacing: 0.4em; background: rgba(212,160,23,0.08); padding: 20px 10px; border-radius: 12px; border: 1px dashed rgba(212,160,23,0.4); display: inline-block; width: 80%; text-shadow: 0 0 10px rgba(212,160,23,0.2);">
          ${otp}
        </div>
      </div>
      
      <p style="margin: 30px 0 0 0; text-align: center; color: #9ca3af; font-size: 0.8rem;">If you did not make this request, you can safely ignore this mail; your credentials remain secure.</p>
      `
    );

    const recipient = getRecipientEmail(email);
    // console.log(`\n🔑 [Password Reset OTP Bypass]`);
    // console.log(`- Original Email: ${email}`);
    // console.log(`- OTP: ${otp}\n`);

    const { data: resData, error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [recipient],
      subject: "✦ Your Password Reset OTP",
      html: htmlContent,
    });
    if (error) throw error;
    return { success: true, data: resData };
  } catch (err) {
    console.error("Reset password email fail:", err);
    return { success: false, error: err };
  }
}

export async function sendEventRegistrationConfirmation(data: {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startDate: string;
  venue: string;
}) {
  try {
    const dateFormatted = new Date(data.startDate).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = getLuxuryTemplate(
      "Registration Received ✦",
      `
      <p style="margin: 0 0 20px 0;">Dear <strong>${data.guestName}</strong>,</p>
      <p style="margin: 0 0 24px 0; color: #d1d5db;">Thank you for your RSVP to <strong>${data.eventTitle}</strong>. Your registration is currently <strong>pending review</strong>. We will notify you via email and messaging once your booking is confirmed.</p>
      
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(212, 160, 23, 0.15); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; width: 30%;">Event</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700;">${data.eventTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Date & Time</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Location</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">${data.venue}</td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 0; color: #9ca3af; font-size: 0.85rem; line-height: 1.6;">We look forward to hosting you soon.</p>
      `
    );

    const recipient = getRecipientEmail(data.guestEmail);
    const { error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [recipient],
      subject: `✦ RSVP Received: ${data.eventTitle}`,
      html: htmlContent,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[Email] Event confirmation failed:", err);
    return { success: false, error: err };
  }
}

export async function sendEventRegistrationApproved(data: {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startDate: string;
  venue: string;
}) {
  try {
    const dateFormatted = new Date(data.startDate).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const htmlContent = getLuxuryTemplate(
      "Booking Confirmed 🎉",
      `
      <p style="margin: 0 0 20px 0;">Dear <strong>${data.guestName}</strong>,</p>
      <p style="margin: 0 0 24px 0; color: #d1d5db;">We are absolutely thrilled to confirm your registration for <strong>${data.eventTitle}</strong>. Your ticket is officially <strong style="color: #22c55e;">approved</strong>!</p>
      
      <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 10px 20px rgba(34,197,94,0.05);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; width: 30%;">Event</td>
            <td style="padding: 8px 0; color: #ffffff; font-weight: 700;">${data.eventTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Date & Time</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">${dateFormatted}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Location</td>
            <td style="padding: 8px 0; color: #ffffff; border-top: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">${data.venue}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; border-top: 1px solid rgba(255,255,255,0.05);">Status</td>
            <td style="padding: 8px 0; color: #22c55e; border-top: 1px solid rgba(255,255,255,0.05); font-weight: 800; font-size: 0.9rem;">CONFIRMED ENTRY</td>
          </tr>
        </table>
      </div>
      
      <p style="margin: 0; color: #d4a017; font-weight: 700; font-size: 0.95rem; text-align: center;">Please keep this email handy for entrance validation at the venue gate.</p>
      `
    );

    const recipient = getRecipientEmail(data.guestEmail);
    const { error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [recipient],
      subject: `🎉 Ticket Confirmed: ${data.eventTitle}!`,
      html: htmlContent,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[Email] Event approval email failed:", err);
    return { success: false, error: err };
  }
}

export async function sendBulkDeleteOtpEmail(otp: string, count: number, resource: string) {
  const adminEmail = process.env.EMAIL_TO || "sayantanbharati611@gmail.com";
  try {
    const htmlContent = getLuxuryTemplate(
      "Bulk Delete Authorization OTP",
      `
      <p style="margin: 0 0 20px 0; color: #d1d5db;">A request to <strong style="color: #fff;">permanently delete ${count} ${resource}</strong> was initiated from the admin dashboard.</p>
      <p style="margin: 0 0 24px 0; color: #d1d5db;">Use the OTP below to authorize this critical action. <strong>This code expires in 5 minutes.</strong></p>
      
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 2.8rem; font-weight: 800; color: #d4a017; letter-spacing: 0.4em; background: rgba(212,160,23,0.08); padding: 20px 10px; border-radius: 12px; border: 1px dashed rgba(212,160,23,0.4); display: inline-block; width: 80%; text-shadow: 0 0 10px rgba(212,160,23,0.2);">
          ${otp}
        </div>
      </div>
      
      <p style="margin: 20px 0 0 0; text-align: center; color: #9ca3af; font-size: 0.8rem;">If you did not initiate this action, secure your admin account immediately.</p>
      `
    );

    const recipient = getRecipientEmail(adminEmail);

    const { error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [recipient],
      subject: `🔐 Admin OTP: Authorize bulk delete of ${count} ${resource}`,
      html: htmlContent,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("Bulk delete OTP email fail:", err);
    return { success: false, error: err };
  }
}

export async function sendEventRegistrationRejected(data: {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
}) {
  try {
    const htmlContent = getLuxuryTemplate(
      "Registration Status Update",
      `
      <p style="margin: 0 0 20px 0;">Dear <strong>${data.guestName}</strong>,</p>
      <p style="margin: 0 0 24px 0; color: #d1d5db; line-height: 1.8;">Thank you for your interest in attending <strong>${data.eventTitle}</strong>. Due to exceptionally high demand and venue capacity constraints, we regret to inform you that we are unable to approve your booking request at this time.</p>
      
      <div style="background: rgba(255, 71, 87, 0.05); border-left: 3px solid #ff4757; padding: 20px; border-radius: 0 12px 12px 0; color: #e5e7eb; margin-bottom: 24px;">
        We hope to accommodate you at one of our future live concerts or exclusive show lineups.
      </div>
      
      <p style="margin: 0; color: #9ca3af; font-size: 0.85rem;">Feel free to browse other upcoming events on the BlueEye portal.</p>
      `
    );

    const recipient = getRecipientEmail(data.guestEmail);
    const { error } = await resend.emails.send({
      from: "BlueEyeEntertainment <onboarding@resend.dev>",
      to: [recipient],
      subject: `Update on your RSVP for ${data.eventTitle}`,
      html: htmlContent,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[Email] Event rejection email failed:", err);
    return { success: false, error: err };
  }
}
