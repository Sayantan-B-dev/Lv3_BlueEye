/**
 * WhatsApp notification utility
 * Uses Meta WhatsApp Cloud API (free tier: 1000 conversations/month)
 * Gracefully no-ops if env vars are not configured.
 *
 * Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
 * Required env vars:
 *   WHATSAPP_API_TOKEN       — permanent token from Meta
 *   WHATSAPP_PHONE_NUMBER_ID — phone number ID from Meta dashboard
 */

export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn("[WhatsApp] Skipped — WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set.");
    return false;
  }

  // Normalize phone: ensure it starts with country code, no '+' or spaces
  const normalizedPhone = phone.replace(/\D/g, "");

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalizedPhone,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("[WhatsApp] API error:", err);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[WhatsApp] Request failed:", err);
    return false;
  }
}
