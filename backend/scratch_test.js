import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
console.log("Using API Key:", apiKey);

const genAI = new GoogleGenerativeAI(apiKey);

const models = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-2.5-pro",
  "gemini-pro"
];

async function run() {
  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const response = await model.generateContent("Hello, are you working?");
      console.log(`  Success with ${modelName}! Response text:`, response.response.text());
      break;
    } catch (err) {
      console.error(`  Failed with ${modelName}:`, err.message || err);
    }
  }
}

run();
