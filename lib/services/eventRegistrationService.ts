import EventRegistration from "@/lib/models/EventRegistration";
import Event from "@/lib/models/Event";
import { connectToDatabase } from "@/lib/db/connect";
import { sendEventRegistrationConfirmation, sendEventRegistrationApproved, sendEventRegistrationRejected } from "@/lib/utils/email";

export async function registerForEvent(data: {
  eventId: string;
  userId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  headcount?: number;
  message?: string;
}) {
  await connectToDatabase();

  // Check capacity
  const event = await Event.findById(data.eventId).lean() as any;
  if (!event) throw new Error("Event not found");
  if (!event.registrationOpen) throw new Error("Registration is closed for this event");
  if (["Completed", "Cancelled"].includes(event.status)) throw new Error("This event is no longer accepting registrations");

  if (event.capacity > 0) {
    const existing = await EventRegistration.countDocuments({
      eventId: data.eventId,
      status: { $in: ["Pending", "Approved"] },
    });
    if (existing >= event.capacity) throw new Error("Event is at full capacity");
  }

  // Prevent duplicate registrations from same email
  const duplicateEmail = await EventRegistration.findOne({
    eventId: data.eventId,
    guestEmail: data.guestEmail.toLowerCase(),
  });
  if (duplicateEmail) throw new Error("You have already registered for this event");
  // Prevent duplicate registrations from same logged-in user
  if (data.userId) {
    const duplicateUser = await EventRegistration.findOne({
      eventId: data.eventId,
      userId: data.userId,
    });
    if (duplicateUser) throw new Error("You have already registered for this event");
  }

  const reg = await EventRegistration.create({
    ...data,
    userId: data.userId || null,
    status: "Pending",
  });

  // Notifications (fire-and-forget)
  const startDate = new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  sendEventRegistrationConfirmation({
    guestName: data.guestName,
    guestEmail: data.guestEmail,
    eventTitle: event.title,
    startDate,
    venue: event.venue?.city || "TBA",
  }).then((r) => {
    if (r.success) EventRegistration.findByIdAndUpdate(reg._id, { emailSent: true }).exec();
  });

  return JSON.parse(JSON.stringify(reg));
}

export async function getRegistrationsByEvent(eventId: string) {
  await connectToDatabase();
  const regs = await EventRegistration.find({ eventId }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(regs));
}

export async function getRegistrationCountByEvent(eventId: string) {
  await connectToDatabase();
  return EventRegistration.countDocuments({ eventId, status: { $in: ["Pending", "Approved"] } });
}

/** Returns the user's registration for an event, if any (by account or email). */
export async function getRegistrationForUser(
  eventId: string,
  opts: { userId?: string; email?: string }
) {
  await connectToDatabase();
  const email = opts.email?.trim().toLowerCase();
  const or: Record<string, unknown>[] = [];
  if (opts.userId && opts.userId !== "admin-static") {
    or.push({ userId: opts.userId });
  }
  if (email) or.push({ guestEmail: email });
  if (or.length === 0) return null;

  const reg = await EventRegistration.findOne({ eventId, $or: or }).lean();
  return reg ? JSON.parse(JSON.stringify(reg)) : null;
}

export async function updateRegistrationStatus(
  rid: string,
  status: "Pending" | "Approved" | "Rejected" | "Waitlisted",
  adminNotes?: string
) {
  await connectToDatabase();
  const reg = await EventRegistration.findByIdAndUpdate(
    rid,
    { status, ...(adminNotes !== undefined ? { adminNotes } : {}) },
    { new: true }
  ).lean() as any;

  if (!reg) throw new Error("Registration not found");

  const event = await Event.findById(reg.eventId).lean() as any;
  const startDate = event
    ? new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : "TBA";
  const eventTitle = event?.title || "the event";

  if (status === "Approved") {
    sendEventRegistrationApproved({
      guestName: reg.guestName,
      guestEmail: reg.guestEmail,
      eventTitle,
      startDate,
      venue: event?.venue?.city || "TBA",
    });
  } else if (status === "Rejected") {
    sendEventRegistrationRejected({
      guestName: reg.guestName,
      guestEmail: reg.guestEmail,
      eventTitle,
    });
  }

  return JSON.parse(JSON.stringify(reg));
}
