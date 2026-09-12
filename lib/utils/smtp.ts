import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD);
}

export function getSmtpFrom(): string {
  return process.env.SMTP_FROM || `BlueEye <${process.env.SMTP_USER}>`;
}

function getTransporter(): Transporter {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_APP_PASSWORD || "").replace(/\s+/g, ""),
    },
  });
  return transporter;
}

/**
 * Send a user-facing email DIRECTLY to the real recipient via Gmail SMTP.
 * No EMAIL_TO redirect — unlike Resend sandbox. Throws on failure so callers
 * can fall back to Resend.
 *
 * Deliverability notes (free @gmail.com sender):
 * - Always send a plain-text part alongside HTML (spam filters penalize HTML-only).
 * - Keep subjects plain (no decorative symbols) and the From name constant.
 * - nodemailer sets Message-ID + Date automatically; Gmail signs DKIM as gmail.com.
 */
export async function sendViaSmtp(to: string, subject: string, html: string, text?: string) {
  const tx = getTransporter();
  const from = getSmtpFrom();
  await tx.sendMail({
    from,
    replyTo: from,
    to,
    subject,
    text: text ?? subject,
    html,
  });
}
