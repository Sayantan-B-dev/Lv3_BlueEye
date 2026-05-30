import mongoose from "mongoose";
import Artist from "../lib/models/Artist";
import Event from "../lib/models/Event";
import Review from "../lib/models/Review";

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI as string);
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
