import { revalidatePath } from "next/cache";
import Event from "@/lib/models/Event";
import SiteSetting, { SITE_SETTING_EVENTS } from "@/lib/models/SiteSetting";
import { connectToDatabase } from "@/lib/db/connect";
import { getCache, setCache, invalidateCache } from "@/lib/db/redis";
import { cacheConfig } from "@/lib/config/cache";

export const DEFAULT_LOCK_MESSAGE =
  "Work ongoing — we are putting the finishing touches on this event. Please check back shortly.";

export interface LockState {
  locked: boolean;
  message: string;
  /** Which switch caused the freeze (null when open). */
  scope: "global" | "event" | null;
}

const UNLOCKED: LockState = { locked: false, message: "", scope: null };

/** Site-wide events lock. Redis-cached; invalidated on every write. */
export async function getGlobalEventsLock(): Promise<{ locked: boolean; message: string }> {
  const key = cacheConfig.events.lockKey;
  const cached = await getCache<{ locked: boolean; message: string }>(key);
  if (cached && typeof cached.locked === "boolean") return cached;

  await connectToDatabase();
  const doc = (await SiteSetting.findById(SITE_SETTING_EVENTS).lean()) as
    | { eventsLocked?: boolean; eventsLockMessage?: string }
    | null;
  const value = {
    locked: doc?.eventsLocked === true,
    message: doc?.eventsLockMessage || DEFAULT_LOCK_MESSAGE,
  };
  await setCache(key, value, cacheConfig.events.lockTtlSeconds);
  return value;
}

/** One-click freeze / unfreeze for the whole events section. */
export async function setGlobalEventsLock(input: {
  locked: boolean;
  message?: string;
  updatedBy?: string;
}): Promise<{ locked: boolean; message: string }> {
  await connectToDatabase();
  const doc = (await SiteSetting.findByIdAndUpdate(
    SITE_SETTING_EVENTS,
    {
      $set: {
        eventsLocked: input.locked,
        eventsLockMessage: input.message?.trim() || DEFAULT_LOCK_MESSAGE,
        updatedBy: input.updatedBy,
      },
    },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
  ).lean()) as { eventsLocked?: boolean; eventsLockMessage?: string } | null;

  if (!doc) throw new Error("Could not persist the events freeze state");
  await invalidateCache(cacheConfig.events.lockKey);
  return {
    locked: doc.eventsLocked === true,
    message: doc.eventsLockMessage || DEFAULT_LOCK_MESSAGE,
  };
}

/**
 * Lock state for code paths that already hold the event document —
 * global switch first, then the per-event freeze. No extra query.
 */
export async function lockStateForEvent(
  event: { ticketing?: { locked?: boolean; lockMessage?: string } } | null
): Promise<LockState> {
  const global = await getGlobalEventsLock();
  if (global.locked) return { locked: true, message: global.message, scope: "global" };
  if (event?.ticketing?.locked) {
    return {
      locked: true,
      message: event.ticketing.lockMessage || DEFAULT_LOCK_MESSAGE,
      scope: "event",
    };
  }
  return UNLOCKED;
}

/** Lock state by slug — for pages and routes that have not loaded the event yet. */
export async function getEventLockState(slug: string): Promise<LockState> {
  const global = await getGlobalEventsLock();
  if (global.locked) return { locked: true, message: global.message, scope: "global" };

  await connectToDatabase();
  const event = (await Event.findOne(
    { slug: slug.toLowerCase() },
    "ticketing.locked ticketing.lockMessage"
  ).lean()) as { ticketing?: { locked?: boolean; lockMessage?: string } } | null;

  if (event?.ticketing?.locked) {
    return {
      locked: true,
      message: event.ticketing.lockMessage || DEFAULT_LOCK_MESSAGE,
      scope: "event",
    };
  }
  return UNLOCKED;
}

/** Drops the cached global lock after a write. */
export async function invalidateEventLockCache(): Promise<void> {
  await invalidateCache(cacheConfig.events.lockKey);
}

/**
 * Public event pages are ISR (revalidate 3600), so a switch flip must mark them
 * stale — otherwise the freeze only appears after the hour expires.
 */
export function revalidateEventPages(): void {
  revalidatePath("/events");
  revalidatePath("/events/[slug]", "page");
}
