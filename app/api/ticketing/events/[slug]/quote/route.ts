import { quoteTickets } from "@/lib/services/ticketingService";
import { ticketQuoteValidation } from "@/lib/utils/validators";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";

// PUBLIC: server-priced quote. Frontend amounts are never trusted.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const parsed = ticketQuoteValidation.safeParse({
      ...body,
      qty: Number(body.qty),
    });
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400, parsed.error.issues);
    }
    const quote = await quoteTickets(slug, parsed.data.tierCode, parsed.data.qty);
    return apiSuccess(quote);
  } catch (error: any) {
    const status = /left|unavailable|not enabled|per order/i.test(error.message || "") ? 400 : 500;
    return apiError(error.message || "Failed to price tickets", status);
  }
}
