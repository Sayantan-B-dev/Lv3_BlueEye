import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { eventsLockValidation } from "@/lib/utils/validators";
import {
  getGlobalEventsLock,
  setGlobalEventsLock,
  revalidateEventPages,
} from "@/lib/services/eventLockService";
import { requireTicketingAdmin } from "../_guard";

// ADMIN: current site-wide events lock state.
export async function GET() {
  const { error } = await requireTicketingAdmin();
  if (error) return error;
  try {
    return apiSuccess(await getGlobalEventsLock());
  } catch (err: any) {
    console.error("[events-lock] read failed:", err);
    return apiError(err.message || "Failed to read events lock", 500);
  }
}

/**
 * ADMIN: one-click freeze/unfreeze of the whole events section.
 * Freezes every public event page and stops new ticket purchases; staff
 * check-in and in-flight payment confirmation stay open.
 */
export async function PATCH(request: Request) {
  const { error, session } = await requireTicketingAdmin();
  if (error) return error;
  try {
    const body = await request.json();
    const parsed = eventsLockValidation.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0].message, 400, parsed.error.issues);
    }

    const state = await setGlobalEventsLock({
      locked: parsed.data.locked,
      message: parsed.data.message,
      updatedBy: session?.user?.email || undefined,
    });

    // ISR pages: mark stale so the switch takes effect immediately.
    revalidateEventPages();

    return apiSuccess(state, state.locked ? "Events locked" : "Events unlocked");
  } catch (err: any) {
    console.error("[events-lock] write failed:", err);
    return apiError(err.message || "Failed to update events lock", 500);
  }
}
