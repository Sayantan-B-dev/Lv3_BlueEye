import QRCode from "qrcode";

/** Public verification URL embedded in ticket QR codes (token only, no IDs). */
export function ticketVerifyUrl(secureToken: string): string {
  const base =
    process.env.TICKETING_QR_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "";
  return `${base}/my-ticket/${secureToken}`;
}

/** QR PNG dataURL for email embedding. */
export async function ticketQrDataUrl(secureToken: string): Promise<string> {
  return QRCode.toDataURL(ticketVerifyUrl(secureToken), {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}
