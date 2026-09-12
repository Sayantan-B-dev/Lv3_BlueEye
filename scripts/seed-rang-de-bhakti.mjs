/**
 * Seed Rang De Bhakti showcase event + 4 tiers (800 total).
 * Run:  node scripts/seed-rang-de-bhakti.mjs
 * Loads .env.local automatically (falls back to process env).
 * Upsert-safe: re-runnable, never duplicates.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Tiny .env.local loader (no extra deps).
function loadLocalEnv() {
  const p = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}
loadLocalEnv();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || "BlueEye";
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local or env.");
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
console.log(`connected: ${DB_NAME}`);

const slug = "rang-de-bhakti";
const startDate = new Date("2026-11-15T18:00:00+05:30");

await db.collection("events").updateOne(
  { slug },
  {
    $setOnInsert: { createdAt: new Date() },
    $set: {
      title: "Rang De Bhakti",
      slug,
      description:
        "An unforgettable evening of devotional music and celebration. Rang De Bhakti brings together soulful voices, a grand stage production with premium sound and lights, festive food stalls, and an atmosphere of pure joy. Book your tickets now — 800 seats only.",
      shortDescription: "A grand devotional concert night — live performances, production and festive stalls.",
      category: "Concert",
      venue: {
        name: "Science City Auditorium",
        city: "Kolkata",
        state: "West Bengal",
        address: "JBS Haldane Avenue, Kolkata 700046",
      },
      startDate,
      endDate: new Date("2026-11-15T22:00:00+05:30"),
      status: "Upcoming",
      featured: true,
      capacity: 800,
      registrationOpen: true,
      tags: ["devotional", "concert", "live", "kolkata"],
      artists: [],
      ticketing: { enabled: true, feePct: 0, feeFlatPaise: 0, gstPct: 0, maxPerOrder: 6 },
      highlights: [
        "Live devotional performances by headline artists",
        "Premium sound, lights and grand stage production",
        "Festive food and merchandise stalls at the venue",
      ],
      termsConditions:
        "Tickets are non-transferable. Entry only with a valid QR code. Gates open 1 hour before showtime. The organizer reserves the right to deny entry for misconduct.",
      refundPolicy:
        "Tickets are non-refundable except on event cancellation, in which case the full amount is refunded to the source account within 7 working days.",
      contactInfo: { name: "Blue Eye Entertainment", phone: "", email: "" },
      updatedAt: new Date(),
    },
  },
  { upsert: true }
);
const event = await db.collection("events").findOne({ slug });
console.log(`event ok: ${event.title} (${event._id})`);

for (const t of TIERS) {
  await db.collection("tickettiers").updateOne(
    { eventId: event._id, code: t.code },
    {
      $setOnInsert: { eventId: event._id, soldQty: 0, createdAt: new Date() },
      $set: { ...t, status: "Active", updatedAt: new Date() },
    },
    { upsert: true }
  );
  console.log(`tier ${t.code} ok`);
}

// Verify
const tiers = await db.collection("tickettiers").find({ eventId: event._id }).toArray();
const total = tiers.reduce((s, t) => s + t.totalQty, 0);
console.log(`verify: ${tiers.length} tiers, ${total} total capacity, ticketing=${event.ticketing?.enabled}`);
console.log(`showcase: /events/${slug}`);

await mongoose.disconnect();
