import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend-local env first, then allow project-root env as a fallback.
dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../../../.env") });

export const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/intentai",
  // Gemini (replaces Groq)
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  // Sarvam AI (Speech-to-Text)
  sarvamApiKey: process.env.SARVAM_API_KEY || "",
  // Legacy Blockfrost
  blockfrostApiKey: process.env.BLOCKFROST_API_KEY || "",
  preprodBlockfrostApiKey: process.env.PREPROD_BLOCKFROST_API_KEY || "",
  mainnetBlockfrostApiKey: process.env.MAINNET_BLOCKFROST_API_KEY || "",
  cardanoNetwork: process.env.CARDANO_NETWORK || "preprod",
  isDev: process.env.NODE_ENV !== "production"
};
