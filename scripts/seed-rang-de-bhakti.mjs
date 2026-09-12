/**
 * Seed Rang De Bhakti ticketing event + 4 tiers (800 total).
 * Run:  MONGODB_URI="mongodb+srv://..." MONGODB_DB_NAME=BlueEye node scripts/seed-rang-de-bhakti.mjs
 * Or reuse the admin APIs instead: POST tiers + PATCH config (no script needed).
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "BlueEye";
if (!MONGODB_URI) {
  console.error("Set MONGODB_URI first.");
  process.exit(1);
}

const TIERS = [
  { code: "GEN", name: "General", pricePaise: 59900, totalQty: 300 },
  { code: "PREM", name: "Premium", pricePaise: 99900, totalQty: 250 },
  { code: "VIP", name: "VIP", pricePaise: 149900, totalQty: 150 },
  { code: "VVIP", name: "VVIP", pricePaise: 259900, totalQty: 100 },
];

await mongoose.connect(MONGODB_URI, { dbName: DB_NAME, maxPoolSize: 5 });
const db = mongoose.connection.db;

const slug = "rang-de-bhakti";
const existing = await db.collection("events").findOne({ slug });
if (!existing) {
  console.error(`Event "${slug}" not found. Create it in /admin/events/new first, then re-run.`);
  await mongoose.disconnect();
  process.exit(1);
}

await db.collection("events").updateOne(
  { _id: existing._id },
  {
    $set: {
      ticketing: { enabled: true, feePct: 0, feeFlatPaise: 0, gstPct: 0, maxPerOrder: 6 },
      highlights: [
        "Live devotional performances by headline artists",
        "Premium sound, lights and stage production",
        "Food and festive stalls at the venue",
      ],
      termsConditions: "Tickets are non-transferable. Entry only with a valid QR. Organizer reserves the right to deny entry for misconduct.",
      refundPolicy: "Tickets are non-refundable except on event cancellation, in which case the full amount is refunded to the source account within 7 working days.",
      contactInfo: { name: "Blue Eye Entertainment", phone: "", email: "" },
    },
  }
);

for (const t of TIERS) {
  await db.collection("tickettiers").updateOne(
    { eventId: existing._id, code: t.code },
    { $setOnInsert: { eventId: existing._id, ...t, soldQty: 0, status: "Active", createdAt: new Date(), updatedAt: new Date() } },
    { upsert: true }
  );
  console.log(`tier ${t.code} ok`);
}

console.log("Done. Enable/disable anytime via PATCH /api/admin/ticketing/events/<id>/config");
await mongoose.disconnect();
