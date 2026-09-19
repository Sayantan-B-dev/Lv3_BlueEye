import { connectToDatabase } from "@/lib/db/connect";
import Event from "@/lib/models/Event";
import { ticketingConfigValidation } from "@/lib/utils/validators";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { invalidateEventLockCache, revalidateEventPages } from "@/lib/services/eventLockService";
import { requireTicketingAdmin } from "../../../_guard";

// ADMIN: update ticketing config + event page content for an event.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const { id } = await params;
    const body = await request.json();
    const set: Record<string, any> = {};
    if (body.ticketing) {
      const parsed = ticketingConfigValidation.safeParse(body.ticketing);
      if (!parsed.success) {
        return apiError(parsed.error.issues[0].message, 400, parsed.error.issues);
      }
      for (const [k, v] of Object.entries(parsed.data)) {
        if (v !== undefined) set[`ticketing.${k}`] = v;
      }
      if (parsed.data.locked === true) set["ticketing.lockedAt"] = new Date();
    }
    if (Array.isArray(body.highlights)) set.highlights = body.highlights.slice(0, 20);
    if (typeof body.termsConditions === "string") set.termsConditions = body.termsConditions.slice(0, 8000);
    if (typeof body.refundPolicy === "string") set.refundPolicy = body.refundPolicy.slice(0, 8000);
    if (body.contactInfo && typeof body.contactInfo === "object") {
      set.contactInfo = {
        name: String(body.contactInfo.name || "").slice(0, 120),
        phone: String(body.contactInfo.phone || "").slice(0, 20),
        email: String(body.contactInfo.email || "").slice(0, 120),
      };
    }
    if (Object.keys(set).length === 0) return apiError("Nothing to update", 400);
    await connectToDatabase();
    const event = (await Event.findByIdAndUpdate(id, { $set: set }, { new: true }).lean()) as
      | { slug?: string }
      | null;
    if (!event) return apiError("Event not found", 404);

    // Public event pages are ISR — mark them stale so a freeze shows up at once.
    await invalidateEventLockCache();
    revalidateEventPages();

    return apiSuccess(event, "Ticketing config saved");
  } catch (err: any) {
    return apiError(err.message || "Failed to save config", 500);
  }
}
