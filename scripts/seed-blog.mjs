import mongoose from "mongoose";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, "..", ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars = Object.fromEntries(
  envContent.split("\n").filter(Boolean).map((line) => {
    const idx = line.indexOf("=");
    return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
  })
);

const MONGODB_URI = envVars.MONGODB_URI;
const MONGODB_DB_NAME = envVars.MONGODB_DB_NAME || "BlueEye";
if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in .env.local");
  process.exit(1);
}

const blogSchema = new mongoose.Schema({}, { strict: false, collection: "blogposts" });
const BlogPost = mongoose.model("BlogPost", blogSchema);

const seedPosts = [
  {
    title: "How to Book a Singer for Your Wedding in India: The Complete Guide",
    slug: "how-to-book-singer-wedding-india",
    excerpt:
      "Planning a wedding in India and looking for the perfect singer? Our complete guide covers everything from budgeting and auditioning to contracts and logistics.",
    content: `<h2>Why Live Music Matters at Indian Weddings</h2>
<p>Indian weddings are known for their grandeur, vibrant celebrations, and rich traditions. Music is the heartbeat of these festivities, and hiring the right singer can elevate the entire experience. Whether you want a classical vocalist for the Sangeet or a Bollywood playback singer for the reception, choosing the right artist is crucial.</p>

<h2>Step 1: Define Your Budget and Requirements</h2>
<p>Before you start looking, determine your budget range. Celebrity singers from Bollywood can command anywhere from ₹5 lakhs to ₹1 crore+, while independent artists are more affordable. Also decide on the duration, type of performance, and whether you need sound equipment included.</p>

<h2>Step 2: Research and Shortlist Artists</h2>
<p>Use platforms like Blue Eye Entertainment to discover artists across India. Look for their portfolio, past wedding performances, audio samples, and client reviews. Shortlist 3-5 artists that match your vibe and budget.</p>

<h2>Step 3: Check Availability and Book Early</h2>
<p>Popular wedding dates in India — especially between October and February — fill up fast. It's advisable to book your artist 4-6 months in advance.</p>

<h2>Step 4: The Performance Day</h2>
<p>Ensure the artist has a green room, sound check time, and clear schedule. Most professional singers will perform 4-6 songs in a 45-minute set.</p>

<p>Ready to book? Browse our <a href="/artists">artist directory</a> or <a href="/contact">contact us</a> for personalized recommendations.</p>`,
    coverImage: "/images/blog/wedding-singer-guide.jpg",
    category: "Wedding Guide",
    tags: ["wedding", "singer", "booking guide", "indian wedding", "live music"],
    author: "Blue Eye Entertainment Team",
    published: true,
    publishedAt: new Date("2026-05-28"),
    featured: true,
  },
  {
    title: "5 Types of Bollywood Dancers Every Party Needs",
    slug: "types-of-bollywood-dancers",
    excerpt:
      "Bollywood dance performances bring unmatched energy to any event. From choreographed troupes to fusion dancers, discover which type fits your celebration best.",
    content: `<h2>1. Bollywood Dance Troupes</h2>
<p>Professional Bollywood dance troupes specialize in high-energy choreography with 4-12 dancers. Perfect for wedding receptions, corporate events, and stage shows.</p>

<h2>2. Classical Fusion Dancers</h2>
<p>These artists blend classical Indian dance forms (Kathak, Bharatanatyam) with Bollywood music — a stunning combination for Sangeet ceremonies.</p>

<h2>3. Solo Bollywood Performers</h2>
<p>A single dancer with exceptional stage presence can hold the audience's attention. Great for intimate gatherings or as filler acts between main events.</p>

<h2>4. Dhol Players cum Dancers</h2>
<p>Interactive and engaging, dhol players who dance while playing are a staple at Indian weddings. They lead the baraat and get everyone on their feet.</p>

<h2>5. Fire and LED Dancers</h2>
<p>For evening events, fire dancers and LED performers add a visual spectacle. They're becoming increasingly popular at destination weddings and after-parties.</p>`,
    coverImage: "/images/blog/bollywood-dancers.jpg",
    category: "Event Planning",
    tags: ["bollywood dancers", "dance troupe", "wedding entertainment", "live performance"],
    author: "Blue Eye Entertainment Team",
    published: true,
    publishedAt: new Date("2026-05-30"),
    featured: false,
  },
  {
    title: "The Rise of Independent Music Festivals in India: 2024 & Beyond",
    slug: "rise-independent-music-festivals-india",
    excerpt:
      "Independent music festivals are reshaping India's live entertainment landscape. We explore the trend and how indie artists are leveraging these platforms.",
    content: `<h2>A New Era for Indian Live Music</h2>
<p>Over the past five years, independent music festivals have exploded across India — from NH7 Weekender and Ziro Festival to newer entrants like Magnetic Fields and Lollapalooza India. These festivals are creating a parallel ecosystem where indie artists thrive.</p>

<h2>Why Indie Festivals Matter</h2>
<p>Independent festivals offer artists creative freedom they often don't get in the Bollywood playback system. They also allow for genre experimentation — folk fusion, electronic, rock, and hip-hop all find space.</p>

<h2>The Business Side</h2>
<p>For artists, festival gigs are becoming a significant revenue stream. A mid-tier indie band can earn ₹2-5 lakhs per festival appearance, while headliners command ₹10-20 lakhs.</p>

<h2>How Blue Eye Entertainment Supports Indie Talent</h2>
<p>We actively scout and promote independent artists across India. Our platform connects festival organizers with emerging talent, ensuring fair bookings and transparent contracts.</p>`,
    coverImage: "/images/blog/indie-festivals.jpg",
    category: "Industry Insights",
    tags: ["music festivals", "indie music", "live events", "indian music scene"],
    author: "Blue Eye Entertainment Team",
    published: true,
    publishedAt: new Date("2026-05-25"),
    featured: false,
  },
  {
    title: "Pre-Wedding Shoot: Why You Should Book a Live Musician",
    slug: "pre-wedding-shoot-live-musician",
    excerpt:
      "A live musician on your pre-wedding shoot set adds magic that recorded tracks simply can't match. Here's why more couples are choosing live music for their candid moments.",
    content: `<h2>The Magic of Live Music on Camera</h2>
<p>Pre-wedding shoots have become a cinematic affair. While background music is often added in post-production, having a live musician on set creates authentic, emotional moments that cameras capture beautifully.</p>

<h2>Benefits of Live Music for Pre-Wedding Shoots</h2>
<ul>
<li><strong>Natural chemistry:</strong> The couple responds differently to live music — more relaxed, more romantic.</li>
<li><strong>Audio-visual sync:</strong> The videographer captures real-time audio and video, eliminating post-production mismatches.</li>
<li><strong>Unique content:</strong> A guitarist or violinist adds visual interest as part of the frame.</li>
<li><strong>Personalized experience:</strong> The musician can adapt tempo and style on the fly to match the couple's mood.</li>
</ul>

<h2>Which Instruments Work Best?</h2>
<p>Acoustic guitar, violin, flute, and piano (keyboard) are the most popular choices. For destination shoots in Goa or Udaipur, a Spanish guitarist adds a dreamy vibe.</p>`,
    coverImage: "/images/blog/pre-wedding-musician.jpg",
    category: "Wedding Guide",
    tags: ["pre-wedding shoot", "live music", "musician for shoot", "couple shoot"],
    author: "Blue Eye Entertainment Team",
    published: true,
    publishedAt: new Date("2026-05-20"),
    featured: false,
  },
  {
    title: "How to Choose the Perfect DJ for Your New Year's Eve Party",
    slug: "choose-dj-new-year-party",
    excerpt:
      "The right DJ can make or break your NYE party. From genre to equipment, we break down everything you need to consider before booking.",
    content: `<h2>Start With the Vibe</h2>
<p>Are you planning a club-style bash, a rooftop lounge party, or a family-friendly gathering? The DJ you choose should match the event's energy. A Bollywood EDM DJ won't suit a jazz lounge, and vice versa.</p>

<h2>Check Their Equipment</h2>
<p>Professional DJs should carry their own mixer, controller, and backup equipment. Club-standard setups include Pioneer DJ gear. Also confirm whether PA/speakers are included in the package.</p>

<h2>Listen to Sets and Read Reviews</h2>
<p>Ask for recordings of recent live sets (not studio mixes). Read reviews from previous NYE bookings — crowd reading is different from regular gigs.</p>

<h2>Discuss the Playlist</h2>
<p>Share your do-not-play list and must-play list. A good DJ will blend requests seamlessly without breaking the flow.</p>

<h2>Book Early for NYE</h2>
<p>New Year's Eve is the busiest night of the year. Top DJs are booked 2-3 months in advance. Use Blue Eye Entertainment to browse available DJs and compare packages.</p>`,
    coverImage: "/images/blog/nye-dj-guide.jpg",
    category: "Event Planning",
    tags: ["dj booking", "new year party", "nye music", "event planning"],
    author: "Blue Eye Entertainment Team",
    published: true,
    publishedAt: new Date("2026-05-15"),
    featured: false,
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB_NAME });
    console.log("Connected to MongoDB");

    await BlogPost.deleteMany({});
    console.log("Cleared existing blog posts");

    const result = await BlogPost.insertMany(seedPosts);
    console.log(`Seeded ${result.length} blog posts:`);
    result.forEach((post, i) => {
      console.log(`  ${i + 1}. ${post.title} (${post.category})`);
    });

    await mongoose.disconnect();
    console.log("\nSeed complete!");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
}

seed();
