import mongoose from "mongoose";

/** Atomic per-key sequence generator (order codes, ticket codes). */
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
}, { versionKey: false });

const Counter = mongoose.models.Counter || mongoose.model("Counter", CounterSchema);

/** Atomically increments and returns the next sequence number for a key. */
export async function nextSequence(key: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return (doc as { seq: number }).seq;
}

export default Counter;
