import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API);

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
    const { data: resData, error } = await resend.emails.send({
      from: "BlueEye <onboarding@resend.dev>", // Replace with verified domain in prod
      to: [toEmail],
      subject: `New Inquiry for ${data.artistName} from ${data.clientName}`,
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #d4a017;">New Artist Inquiry</h2>
          <p><strong>Artist:</strong> ${data.artistName}</p>
          <hr />
          <p><strong>Client Name:</strong> ${data.clientName}</p>
          <p><strong>Email:</strong> ${data.clientEmail}</p>
          <p><strong>Phone:</strong> ${data.clientPhone}</p>
          <p><strong>Event Type:</strong> ${data.eventType}</p>
          <p><strong>Event Date:</strong> ${data.eventDate || "Not specified"}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f9f9f9; padding: 1rem; border-radius: 5px;">
            ${data.message || "No message provided."}
          </div>
          <br />
          <p style="font-size: 0.8rem; color: #777;">This inquiry was sent from the BlueEye platform.</p>
        </div>
      `,
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
    const { data: resData, error } = await resend.emails.send({
      from: "BlueEye <onboarding@resend.dev>",
      to: [email],
      subject: "Verify your BlueEye Account",
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 2rem; background: #0a0807; color: #fff;">
          <h2 style="color: #d4a017;">Verify Your Account</h2>
          <p>Thank you for joining BlueEye. Use the code below to verify your email address. This code will expire in 10 minutes.</p>
          <div style="font-size: 2.5rem; font-weight: bold; color: #d4a017; margin: 2rem 0; letter-spacing: 0.5rem; background: rgba(212,160,23,0.1); padding: 1rem; border-radius: 10px; border: 1px dashed #d4a017;">
            ${code}
          </div>
          <p style="color: #777; font-size: 0.8rem;">If you did not request this, please ignore this email.</p>
        </div>
      `,
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
    const { data: resData, error } = await resend.emails.send({
      from: "BlueEye <onboarding@resend.dev>",
      to: [email],
      subject: "Your Password Reset OTP",
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 2rem; background: #0a0807; color: #fff;">
          <h2 style="color: #d4a017;">Reset Your Password</h2>
          <p>We received a request to reset your password. Use the 6-digit OTP below to proceed. This code will expire in 15 minutes.</p>
          <div style="font-size: 2.5rem; font-weight: bold; color: #d4a017; margin: 2rem 0; letter-spacing: 0.5rem; background: rgba(212,160,23,0.1); padding: 1rem; border-radius: 10px; border: 1px dashed #d4a017;">
            ${otp}
          </div>
          <p style="color: #777; font-size: 0.8rem;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    if (error) throw error;
    return { success: true, data: resData };
  } catch (err) {
    console.error("Reset password email fail:", err);
    return { success: false, error: err };
  }
}

// ── Event notification emails ─────────────────────────────────────────────────

export async function sendEventRegistrationConfirmation(data: {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
  startDate: string;
  venue: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from: "BlueEye <onboarding@resend.dev>",
      to: [data.guestEmail],
      subject: `Your registration for ${data.eventTitle} is received`,
      html: `
        <div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto">
          <h2 style="color:#d4a017">Registration Received ✦</h2>
          <p>Hi <strong>${data.guestName}</strong>,</p>
          <p>Thank you for registering for <strong>${data.eventTitle}</strong>. Your request is <strong>pending review</strong>. We'll notify you once confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:1rem 0">
            <tr><td style="padding:6px 0;color:#777">Event</td><td><strong>${data.eventTitle}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#777">Date</td><td>${data.startDate}</td></tr>
            <tr><td style="padding:6px 0;color:#777">Venue</td><td>${data.venue}</td></tr>
          </table>
          <p style="font-size:0.85rem;color:#777">— BlueEye Events Team</p>
        </div>`,
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
    const { error } = await resend.emails.send({
      from: "BlueEye <onboarding@resend.dev>",
      to: [data.guestEmail],
      subject: `You're confirmed for ${data.eventTitle}! 🎉`,
      html: `
        <div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto">
          <h2 style="color:#d4a017">You're In! 🎉</h2>
          <p>Hi <strong>${data.guestName}</strong>,</p>
          <p>Your registration for <strong>${data.eventTitle}</strong> has been <strong style="color:#16a34a">approved</strong>. We look forward to seeing you!</p>
          <table style="width:100%;border-collapse:collapse;margin:1rem 0">
            <tr><td style="padding:6px 0;color:#777">Event</td><td><strong>${data.eventTitle}</strong></td></tr>
            <tr><td style="padding:6px 0;color:#777">Date</td><td>${data.startDate}</td></tr>
            <tr><td style="padding:6px 0;color:#777">Venue</td><td>${data.venue}</td></tr>
          </table>
          <p style="font-size:0.85rem;color:#777">— BlueEye Events Team</p>
        </div>`,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[Email] Event approval email failed:", err);
    return { success: false, error: err };
  }
}

export async function sendEventRegistrationRejected(data: {
  guestName: string;
  guestEmail: string;
  eventTitle: string;
}) {
  try {
    const { error } = await resend.emails.send({
      from: "BlueEye <onboarding@resend.dev>",
      to: [data.guestEmail],
      subject: `Update on your registration for ${data.eventTitle}`,
      html: `
        <div style="font-family:sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto">
          <h2 style="color:#d4a017">Registration Update</h2>
          <p>Hi <strong>${data.guestName}</strong>,</p>
          <p>Unfortunately we couldn't accommodate your request for <strong>${data.eventTitle}</strong> this time. We hope to see you at a future event.</p>
          <p style="font-size:0.85rem;color:#777">— BlueEye Events Team</p>
        </div>`,
    });
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error("[Email] Event rejection email failed:", err);
    return { success: false, error: err };
  }
}
