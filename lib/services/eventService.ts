import Event from "@/lib/models/Event";
import EventUpdate from "@/lib/models/EventUpdate";
import { connectToDatabase } from "@/lib/db/connect";
import { slugify } from "@/lib/utils/slugify";

export async function getEvents(params: {
  status?: string;
  category?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  await connectToDatabase();

  const filter: any = {};
  if (params.status) filter.status = params.status;
  if (params.category) filter.category = { $regex: new RegExp(`^${params.category}$`, "i") };
  if (params.featured !== undefined) filter.featured = params.featured;

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(24, params.limit || 12);
  const skip = (page - 1) * limit;

  const [events, total] = await Promise.all([
    Event.find(filter).sort({ startDate: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    Event.countDocuments(filter),
  ]);

  return JSON.parse(JSON.stringify({
    events,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }));
}

export async function getEventBySlug(slug: string) {
  await connectToDatabase();
  const event = await Event.findOne({ slug })
    .populate("artists", "name slug category location.city media.images")
    .lean();
  if (!event) return null;

  const updates = await EventUpdate.find({ eventId: (event as any)._id })
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify({ ...event, updates }));
}

export async function createEvent(data: any) {
  await connectToDatabase();
  if (!data.slug) {
    data.slug = slugify(data.title);
  }
  const event = await Event.create(data);
  return JSON.parse(JSON.stringify(event));
}

export async function updateEvent(id: string, data: any) {
  await connectToDatabase();
  if (data.title && !data.slug) {
    data.slug = slugify(data.title);
  }
  const event = await Event.findByIdAndUpdate(id, data, { new: true }).lean();
  return JSON.parse(JSON.stringify(event));
}

export async function deleteEvent(id: string) {
  await connectToDatabase();
  return Event.findByIdAndDelete(id);
}

export async function addEventUpdate(eventId: string, data: {
  content: string;
  type?: string;
  attachments?: string[];
  postedBy?: string;
}) {
  await connectToDatabase();
  const update = await EventUpdate.create({ eventId, ...data });
  return JSON.parse(JSON.stringify(update));
}

export async function deleteEventUpdate(uid: string) {
  await connectToDatabase();
  return EventUpdate.findByIdAndDelete(uid);
}

export async function getEventStats() {
  await connectToDatabase();
  const stats = await Event.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return stats.reduce((acc: any, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});
}

export async function getDistinctEventCategories() {
  await connectToDatabase();
  return Event.distinct("category");
}
