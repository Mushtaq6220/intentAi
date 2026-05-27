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
  groqApiKey: process.env.GROQ_API_KEY || "",
  groqModel: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
  blockfrostApiKey: process.env.BLOCKFROST_API_KEY || "",
  preprodBlockfrostApiKey: process.env.PREPROD_BLOCKFROST_API_KEY || "",
  mainnetBlockfrostApiKey: process.env.MAINNET_BLOCKFROST_API_KEY || "",
  cardanoNetwork: process.env.CARDANO_NETWORK || "preprod",
  isDev: process.env.NODE_ENV !== "production"
};

