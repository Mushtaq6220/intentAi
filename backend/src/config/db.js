import mongoose from "mongoose";
import { config } from "./env.js";

let isConnected = false;

/**
 * Connect to MongoDB using the URI from environment config.
 * Safe to call multiple times — will not reconnect if already connected.
 */
export const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is not running
    });
    isConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host} → intentai`);
  } catch (err) {
    console.error(`[MongoDB] Connection failed: ${err.message}`);
    console.warn("[MongoDB] Running in stateless mode — data will not persist to DB.");
    // Do NOT throw — let the app start without DB (localStorage fallback still works)
  }
};

/**
 * Returns true if Mongoose is actively connected to MongoDB.
 */
export const isDBConnected = () =>
  mongoose.connection.readyState === 1;

// Graceful shutdown
process.on("SIGTERM", async () => {
  await mongoose.connection.close();
  console.log("[MongoDB] Connection closed on SIGTERM.");
});
