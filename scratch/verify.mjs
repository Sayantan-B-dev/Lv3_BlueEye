import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(".env") });
dotenv.config({ path: path.resolve(".env.local") });

// Import models
import Artist from "./lib/models/Artist.js";
import Event from "./lib/models/Event.js";
import Review from "./lib/models/Review.js";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully.");

    const artist = await Artist.findOne().lean();
    console.log("\n--- One Artist ---");
    console.log(JSON.stringify(artist, null, 2));

    const event = await Event.findOne().lean();
    console.log("\n--- One Event ---");
    console.log(JSON.stringify(event, null, 2));

    const review = await Review.findOne().lean();
    console.log("\n--- One Review ---");
    console.log(JSON.stringify(review, null, 2));

    mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
