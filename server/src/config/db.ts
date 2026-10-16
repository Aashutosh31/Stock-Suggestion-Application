import mongoose from "mongoose";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

let connected = false;

export async function connectDatabase(uri: string = env.MONGODB_URI): Promise<typeof mongoose> {
  if (connected && mongoose.connection.readyState === 1) return mongoose;

  mongoose.set("strictQuery", true);
  // Never log the connection string (it may contain credentials).
  mongoose.connection.on("connected", () => logger.info("MongoDB connected"));
  mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
  mongoose.connection.on("error", (err) => logger.error({ err: err.message }, "MongoDB connection error"));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 20,
    autoIndex: !env.isProduction,
  });
  connected = true;
  return mongoose;
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    connected = false;
  }
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}
