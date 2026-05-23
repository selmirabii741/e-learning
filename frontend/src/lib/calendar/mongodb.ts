import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConnection: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined;
}

const cached = global.__mongooseConnection ?? { conn: null, promise: null };
global.__mongooseConnection = cached;

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/eduai_calendar";

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName: process.env.MONGODB_DB_NAME ?? "eduai_calendar"
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
