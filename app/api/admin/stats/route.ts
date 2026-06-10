import { connectToDatabase } from "@/lib/db/connect";
import Artist from "@/lib/models/Artist";
import Inquiry from "@/lib/models/Inquiry";
import { apiSuccess, apiError } from "@/lib/utils/apiResponse";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!session || (session.user as any).role !== "admin") {
      return apiError("Unauthorized", 401);
    }

    await connectToDatabase();

    const [
      totalArtists,
      mediaStats,
      missingStats,
      categoryBreakdown,
      totalInquiries,
      inquiryStatusStats
    ] = await Promise.all([
      Artist.countDocuments(),
      Artist.aggregate([
        {
          $group: {
            _id: null,
            totalImages: { $sum: { $size: { $ifNull: ["$media.images", []] } } },
            totalVideos: { $sum: { $size: { $ifNull: ["$media.videos", []] } } }
          }
        }
      ]),
      Artist.aggregate([
        {
          $group: {
            _id: null,
            missingImages: {
              $sum: {
                $cond: [
                  { $or: [
                    { $eq: [{ $ifNull: ["$media.images", null] }, null] },
                    { $eq: [{ $size: { $ifNull: ["$media.images", []] } }, 0] }
                  ]},
                  1, 0
                ]
              }
            },
            missingVideos: {
              $sum: {
                $cond: [
                  { $or: [
                    { $eq: [{ $ifNull: ["$media.videos", null] }, null] },
                    { $eq: [{ $size: { $ifNull: ["$media.videos", []] } }, 0] }
                  ]},
                  1, 0
                ]
              }
            },
            missingBoth: {
              $sum: {
                $cond: [
                  { $and: [
                    { $or: [
                      { $eq: [{ $ifNull: ["$media.images", null] }, null] },
                      { $eq: [{ $size: { $ifNull: ["$media.images", []] } }, 0] }
                    ]},
                    { $or: [
                      { $eq: [{ $ifNull: ["$media.videos", null] }, null] },
                      { $eq: [{ $size: { $ifNull: ["$media.videos", []] } }, 0] }
                    ]}
                  ]},
                  1, 0
                ]
              }
            }
          }
        }
      ]),
      Artist.aggregate([
        {
          $group: {
            _id: "$category",
            total: { $sum: 1 },
            missingImages: {
              $sum: {
                $cond: [
                  { $or: [
                    { $eq: [{ $ifNull: ["$media.images", null] }, null] },
                    { $eq: [{ $size: { $ifNull: ["$media.images", []] } }, 0] }
                  ]},
                  1, 0
                ]
              }
            },
            missingVideos: {
              $sum: {
                $cond: [
                  { $or: [
                    { $eq: [{ $ifNull: ["$media.videos", null] }, null] },
                    { $eq: [{ $size: { $ifNull: ["$media.videos", []] } }, 0] }
                  ]},
                  1, 0
                ]
              }
            },
            missingBoth: {
              $sum: {
                $cond: [
                  { $and: [
                    { $or: [
                      { $eq: [{ $ifNull: ["$media.images", null] }, null] },
                      { $eq: [{ $size: { $ifNull: ["$media.images", []] } }, 0] }
                    ]},
                    { $or: [
                      { $eq: [{ $ifNull: ["$media.videos", null] }, null] },
                      { $eq: [{ $size: { $ifNull: ["$media.videos", []] } }, 0] }
                    ]}
                  ]},
                  1, 0
                ]
              }
            }
          }
        },
        { $sort: { total: -1 } }
      ]),
      Inquiry.countDocuments(),
      Inquiry.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ])
    ]);

    return apiSuccess({
      totalArtists,
      totalImages: mediaStats[0]?.totalImages || 0,
      totalVideos: mediaStats[0]?.totalVideos || 0,
      missingImages: missingStats[0]?.missingImages || 0,
      missingVideos: missingStats[0]?.missingVideos || 0,
      missingBoth: missingStats[0]?.missingBoth || 0,
      totalCategories: categoryBreakdown.length,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      categoryBreakdown: categoryBreakdown.map((c: any) => ({
        category: c._id,
        total: c.total,
        missingImages: c.missingImages,
        missingVideos: c.missingVideos,
        missingBoth: c.missingBoth
      })),
      totalInquiries: totalInquiries || 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inquiryStatuses: inquiryStatusStats.reduce((acc: any, s: any) => {
        acc[s._id] = s.count;
        return acc;
      }, {} as Record<string, number>)
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return apiError(error.message, 500);
  }
}
