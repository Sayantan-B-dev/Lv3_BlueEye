import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongoose:
    | {
      conn: typeof mongoose | null;
      promise: Promise<typeof mongoose> | null;
    }
    | undefined;
}

const cached = global.__mongoose ?? { conn: null, promise: null };

if (!global.__mongoose) {
  global.__mongoose = cached;
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!cached.promise) {
    // M0 (500-connection ceiling): the global singleton only dedupes within ONE
    // Node process, but `next build` fans out to 11 static-gen workers, each
    // opening its own pool (Mongoose default maxPoolSize is 100). Cap the pool
    // so builds + dev + runtime can never approach the Atlas limit.
    // Override via MONGODB_MAX_POOL_SIZE if a larger tier needs more.
    const maxPoolSize = Math.max(
      1,
      parseInt(process.env.MONGODB_MAX_POOL_SIZE || "10", 10) || 10
    );
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "BlueEyeEntertainment",
      maxPoolSize,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
