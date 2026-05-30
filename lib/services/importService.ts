import { artistSchemaValidation } from "@/lib/utils/validators";
import Artist from "@/lib/models/Artist";
import { connectToDatabase } from "@/lib/db/connect";
import { slugify } from "@/lib/utils/slugify";

export async function importArtistsFromJSON(data: any[]) {
  await connectToDatabase();
  const summary = { total: data.length, created: 0, updated: 0, failed: 0, errors: [] as any[] };

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    try {
      const result = artistSchemaValidation.safeParse(item);
      if (!result.success) {
        throw new Error(result.error.issues[0].message);
      }
      const parsed = result.data;
      const slug = parsed.slug || slugify(parsed.name);
      
      const existing = await Artist.findOne({ slug });
      if (existing) {
        Object.assign(existing, parsed);
        await existing.save();
        summary.updated++;
      } else {
        const newArtist = new Artist({ ...parsed, slug });
        await newArtist.save();
        summary.created++;
      }
    } catch (error: any) {
      summary.failed++;
      summary.errors.push({ index: i, name: item.name || "Unknown", error: error.message || "Validation failed" });
    }
  }

  return summary;
}

export async function importEventsFromJSON(data: any[]) {
  await connectToDatabase();
  const summary = { total: data.length, created: 0, updated: 0, failed: 0, errors: [] as any[] };
  const Event = (await import("@/lib/models/Event")).default;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    try {
      if (!item.title || !item.startDate || !item.category) {
        throw new Error("title, category, and startDate are required");
      }
      const slug = item.slug || slugify(item.title);
      
      const existing = await Event.findOne({ slug });
      if (existing) {
        Object.assign(existing, item);
        await existing.save();
        summary.updated++;
      } else {
        const newEvent = new Event({ ...item, slug });
        await newEvent.save();
        summary.created++;
      }
    } catch (error: any) {
      summary.failed++;
      summary.errors.push({ index: i, name: item.title || "Unknown", error: error.message || "Failed to process event" });
    }
  }

  return summary;
}

export async function importReviewsFromJSON(data: any[]) {
  await connectToDatabase();
  const summary = { total: data.length, created: 0, updated: 0, failed: 0, errors: [] as any[] };
  const Review = (await import("@/lib/models/Review")).default;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    try {
      if (!item.user || !item.rating || !item.text) {
        throw new Error("user, rating, and text are required");
      }
      
      // we assume user is already an ObjectId string or similar, or we just rely on mongoose validation
      const existing = await Review.findOne({ user: item.user });
      if (existing) {
        Object.assign(existing, item);
        existing.isEdited = true;
        await existing.save();
        summary.updated++;
      } else {
        const newReview = new Review(item);
        await newReview.save();
        summary.created++;
      }
    } catch (error: any) {
      summary.failed++;
      summary.errors.push({ index: i, name: item.user || "Unknown", error: error.message || "Failed to process review" });
    }
  }

  return summary;
}
