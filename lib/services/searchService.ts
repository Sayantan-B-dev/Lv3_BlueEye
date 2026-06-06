import Artist from "@/lib/models/Artist";
import { connectToDatabase } from "@/lib/db/connect";

export async function searchArtists(
  q: string,
  filters?: { category?: string; city?: string },
  pagination?: { page?: number; limit?: number }
) {
  await connectToDatabase();
  const query: any = { $text: { $search: q } };
  if (filters?.category) query["search.category_lower"] = filters.category.toLowerCase();
  if (filters?.city) query["search.city_lower"] = filters.city.toLowerCase();
  
  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.max(1, Math.min(100, pagination?.limit || 12));
  const skip = (page - 1) * limit;

  const [artists, total] = await Promise.all([
    Artist.find(query, { score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(limit)
      .lean(),
    Artist.countDocuments(query)
  ]);

  return {
    artists: JSON.parse(JSON.stringify(artists)),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
}

export type ArtistSuggestion = {
  _id: string;
  name: string;
  slug: string;
  category: string;
  location?: { city?: string; state?: string };
  media?: { images?: string[] };
};

/** Fast prefix/keyword matching for live search dropdowns */
export async function suggestArtists(
  q: string,
  filters?: { category?: string; city?: string },
  limit = 8
): Promise<ArtistSuggestion[]> {
  await connectToDatabase();
  const trimmed = q.trim();
  if (!trimmed) return [];

  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "i");

  const conditions: Record<string, unknown>[] = [
    {
      $or: [
        { name: regex },
        { category: regex },
        { "location.city": regex },
        { "search.name_lower": regex },
        { "performance.genres": regex },
      ],
    },
  ];

  if (filters?.category) {
    conditions.push({
      $or: [
        { "search.category_lower": filters.category.toLowerCase() },
        { category: { $regex: new RegExp(`^${filters.category}$`, "i") } },
      ],
    });
  }

  if (filters?.city) {
    conditions.push({
      $or: [
        { "search.city_lower": filters.city.toLowerCase() },
        { "location.city": { $regex: new RegExp(`^${filters.city}$`, "i") } },
      ],
    });
  }

  const artists = await Artist.find({ $and: conditions })
    .select("name slug category location media.images")
    .sort({ featured: -1, name: 1 })
    .limit(Math.min(12, Math.max(1, limit)))
    .lean();

  return JSON.parse(JSON.stringify(artists)) as ArtistSuggestion[];
}

export async function getDistinctCategories() {
  await connectToDatabase();
  return Artist.distinct("category");
}

const CITY_ALIASES: Record<string, string> = {
  "new delhi": "Delhi",
  "new delhi ncr": "Delhi",
  "delhi ncr": "Delhi",
  "delhi": "Delhi",
  "newdelhi": "Delhi",
  "bengaluru": "Bangalore",
  "kolkata": "Kolkata",
  "mumbai": "Mumbai",
  "chennai": "Chennai",
  "hyderabad": "Hyderabad",
  "pune": "Pune",
  "ahmedabad": "Ahmedabad",
  "jaipur": "Jaipur",
  "lucknow": "Lucknow",
  "surat": "Surat",
  "indore": "Indore",
  "chandigarh": "Chandigarh",
  "bhopal": "Bhopal",
  "nagpur": "Nagpur",
  "patna": "Patna",
  "kochi": "Kochi",
  "coimbatore": "Coimbatore",
  "goa": "Goa",
  "vizag": "Visakhapatnam",
  "thiruvananthapuram": "Thiruvananthapuram",
};

const CITY_BLOCKLIST = new Set([
  "lahore", "karachi", "islamabad", "rawalpindi", "faisalabad",
]);

function normalizeCity(city: string): string {
  const trimmed = city.trim();
  const lower = trimmed.toLowerCase();
  if (CITY_BLOCKLIST.has(lower)) return "";
  const aliased = CITY_ALIASES[lower];
  if (aliased) return aliased;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export async function getDistinctCities() {
  await connectToDatabase();
  const cities = await Artist.distinct("location.city", {
    $or: [
      { "location.country": "India" },
      { "location.country": { $exists: false } },
    ],
  });
  const normalized = [...new Set(cities.filter(Boolean).map(normalizeCity).filter(Boolean))];
  return normalized.sort();
}

export async function getCategoryCounts() {
  await connectToDatabase();
  const counts = await Artist.aggregate([
    { $group: { _id: "$category", count: { $sum: 1 } } }
  ]);
  return counts.reduce((acc: any, cur) => {
    acc[cur._id] = cur.count;
    return acc;
  }, {});
}

export async function getLatestCategoryUpdates() {
  await connectToDatabase();
  const result = await Artist.aggregate([
    { $match: { category: { $exists: true, $ne: "" } } },
    { $sort: { updatedAt: -1 } },
    { $group: { _id: "$category", updatedAt: { $first: "$updatedAt" } } },
    { $project: { _id: 0, category: "$_id", updatedAt: 1 } },
  ]);
  return result as { category: string; updatedAt: Date }[];
}

export async function getLatestCityUpdates() {
  await connectToDatabase();
  const result = await Artist.aggregate([
    {
      $match: {
        "location.city": { $exists: true, $ne: "" },
        $or: [
          { "location.country": "India" },
          { "location.country": { $exists: false } },
        ],
      },
    },
    { $sort: { updatedAt: -1 } },
    { $group: { _id: "$location.city", updatedAt: { $first: "$updatedAt" } } },
    { $project: { _id: 0, city: "$_id", updatedAt: 1 } },
  ]);
  const normalized = new Map<string, Date>();
  for (const item of result as { city: string; updatedAt: Date }[]) {
    const canonical = normalizeCity(item.city);
    const existing = normalized.get(canonical);
    if (!existing || item.updatedAt > existing) {
      normalized.set(canonical, item.updatedAt);
    }
  }
  return Array.from(normalized.entries()).map(([city, updatedAt]) => ({ city, updatedAt }));
}
