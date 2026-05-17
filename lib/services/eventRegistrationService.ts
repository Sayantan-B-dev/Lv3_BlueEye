import EventRegistration from "@/lib/models/EventRegistration";
import Event from "@/lib/models/Event";
import { connectToDatabase } from "@/lib/db/connect";
import { sendEventRegistrationConfirmation, sendEventRegistrationApproved, sendEventRegistrationRejected } from "@/lib/utils/email";
import { sendWhatsAppMessage } from "@/lib/utils/whatsapp";

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
  const duplicate = await EventRegistration.findOne({
    eventId: data.eventId,
    guestEmail: data.guestEmail.toLowerCase(),
  });
  if (duplicate) throw new Error("You have already registered for this event");

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

  sendWhatsAppMessage(
    data.guestPhone,
    `Hi ${data.guestName}, your registration request for *${event.title}* on ${startDate} has been received! We'll notify you once it's confirmed. 🙏`
  ).then((sent) => {
    if (sent) EventRegistration.findByIdAndUpdate(reg._id, { whatsappSent: true }).exec();
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
    sendWhatsAppMessage(
      reg.guestPhone,
      `🎉 Great news, ${reg.guestName}! Your spot at *${eventTitle}* on ${startDate} is *confirmed*. See you there!`
    );
  } else if (status === "Rejected") {
    sendEventRegistrationRejected({
      guestName: reg.guestName,
      guestEmail: reg.guestEmail,
      eventTitle,
    });
    sendWhatsAppMessage(
      reg.guestPhone,
      `Hi ${reg.guestName}, unfortunately we couldn't accommodate your request for *${eventTitle}* this time. Thank you for your interest!`
    );
  }

  return JSON.parse(JSON.stringify(reg));
}
