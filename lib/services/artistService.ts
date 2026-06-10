import type { PipelineStage } from "mongoose";
import Artist from "@/lib/models/Artist";
import { connectToDatabase } from "@/lib/db/connect";
import { slugify } from "@/lib/utils/slugify";

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  name_asc: { name: 1 },
  name_desc: { name: -1 },
  updated_desc: { updatedAt: -1 },
  updated_asc: { updatedAt: 1 },
  created_desc: { createdAt: -1 },
  created_asc: { createdAt: 1 },
};

export async function getArtists(params: { category?: string; city?: string; page?: number; limit?: number; featured?: boolean; q?: string; missing?: string; sort?: string }) {
  await connectToDatabase();
  
  const conditions: any[] = [];
  
  if (params.q) {
    conditions.push({ $text: { $search: params.q } });
  }

  if (params.category) {
    conditions.push({
      $or: [
        { "search.category_lower": params.category.toLowerCase() },
        { category: { $regex: new RegExp(`^${params.category}$`, "i") } }
      ]
    });
  }

  if (params.city) {
    conditions.push({
      $or: [
        { "search.city_lower": params.city.toLowerCase() },
        { "location.city": { $regex: new RegExp(`^${params.city}$`, "i") } }
      ]
    });
  }

  if (params.featured !== undefined) {
    conditions.push({ featured: params.featured });
  }

  if (params.missing === "images") {
    conditions.push({
      $or: [
        { "media.images": { $exists: false } },
        { "media.images": { $size: 0 } }
      ]
    });
  } else if (params.missing === "videos") {
    conditions.push({
      $or: [
        { "media.videos": { $exists: false } },
        { "media.videos": { $size: 0 } }
      ]
    });
  } else if (params.missing === "both") {
    conditions.push({
      $or: [
        { "media.images": { $exists: false } },
        { "media.images": { $size: 0 } }
      ]
    });
    conditions.push({
      $or: [
        { "media.videos": { $exists: false } },
        { "media.videos": { $size: 0 } }
      ]
    });
  }

  const filter = conditions.length > 0 ? { $and: conditions } : {};

  const page = Math.max(1, params.page || 1);
  const limit = Math.min(24, params.limit || 12);
  const skip = (page - 1) * limit;
  const sort = SORT_MAP[params.sort || "default"];

  let artists;
  if (params.q) {
    const sortObj = sort || { score: { $meta: "textScore" } };
    artists = await Artist.find(filter)
      .select({ score: { $meta: "textScore" } })
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();
  } else {
    const pipeline: PipelineStage[] = [
      { $match: filter },
      {
        $addFields: {
          hasImage: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$media.images", []] } }, 0] },
              1,
              0
            ]
          }
        }
      },
    ];

    if (sort) {
      pipeline.push({ $sort: sort });
    } else {
      pipeline.push({ $sort: { hasImage: -1, createdAt: -1 } });
    }

    pipeline.push({ $skip: skip }, { $limit: limit });

    artists = await Artist.aggregate(pipeline);
  }

  const total = await Artist.countDocuments(filter);

  
  return JSON.parse(JSON.stringify({ 
    artists, 
    total, 
    page, 
    totalPages: Math.ceil(total / limit) 
  }));
}

/** Lightweight query for sitemap generation (not capped at page size 24). */
export async function getArtistsForSitemap(max = 5000) {
  await connectToDatabase();
  const artists = await Artist.find({}, { slug: 1, updatedAt: 1 })
    .sort({ updatedAt: -1 })
    .limit(max)
    .lean();
  return JSON.parse(JSON.stringify(artists)) as { slug: string; updatedAt?: string }[];
}

export async function getArtistBySlug(slug: string) {
  await connectToDatabase();
  const artist = await Artist.findOne({ slug }).lean();
  return artist ? JSON.parse(JSON.stringify(artist)) : null;
}

export async function getArtistById(id: string) {
  await connectToDatabase();
  const artist = await Artist.findById(id).lean();
  return artist ? JSON.parse(JSON.stringify(artist)) : null;
}

export async function createArtist(data: any) {
  await connectToDatabase();
  if (!data.slug) {
    data.slug = slugify(data.name);
  }
  return Artist.create(data);
}

export async function updateArtist(id: string, data: any) {
  await connectToDatabase();
  if (data.name && !data.slug) {
    data.slug = slugify(data.name);
  }
  const artist = await Artist.findById(id);
  if (!artist) throw new Error("Artist not found");

  Object.assign(artist, data);
  await artist.save(); // triggers pre-save hook
  return artist;
}

export async function deleteArtist(id: string) {
  await connectToDatabase();
  return Artist.findByIdAndDelete(id);
}

export async function getRandomArtists(limit: number = 10) {
  await connectToDatabase();
  const artists = await Artist.aggregate([
    { $match: { "media.images": { $exists: true, $not: { $size: 0 } } } },
    { $sample: { size: limit } }
  ]);
  return JSON.parse(JSON.stringify(artists));
}
