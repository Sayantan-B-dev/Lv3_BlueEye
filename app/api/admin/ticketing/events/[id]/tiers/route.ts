import { connectToDatabase } from "@/lib/db/connect";
import TicketTier from "@/lib/models/TicketTier";
import { ticketTierUpsertValidation } from "@/lib/utils/validators";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { requireTicketingAdmin } from "../../../_guard";

// ADMIN: list tiers for an event.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const { id } = await params;
    await connectToDatabase();
    const tiers = await TicketTier.find({ eventId: id }).sort({ pricePaise: 1 }).lean();
    return apiSuccess(tiers);
  } catch (err: any) {
    return apiError(err.message || "Failed to load tiers", 500);
  }
}

// ADMIN: create or update a tier (price/qty/status configurable).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = ticketTierUpsertValidation.safeParse({
      ...body,
      pricePaise: Number(body.pricePaise),
      totalQty: Number(body.totalQty),
    });
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400, parsed.error.issues);
    }
    await connectToDatabase();
    const code = parsed.data.code.toUpperCase();
    const tier = await TicketTier.findOneAndUpdate(
      { eventId: id, code },
      { $set: { ...parsed.data, code, eventId: id } },
      { new: true, upsert: true }
    );
    return apiSuccess(tier, "Tier saved");
  } catch (err: any) {
    return apiError(err.message || "Failed to save tier", 500);
  }
}
