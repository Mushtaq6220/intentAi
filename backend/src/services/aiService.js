import { Groq } from "groq-sdk";
import { config } from "../config/env.js";

let groq = null;

if (config.groqApiKey) {
  try {
    groq = new Groq({ apiKey: config.groqApiKey });
    console.log(`Groq AI SDK successfully initialized with ${config.groqModel}.`);
  } catch (err) {
    console.error("Failed to initialize Groq SDK:", err.message);
  }
} else {
  console.log("Note: GROQ_API_KEY is empty. The backend will operate in fallback sandbox mode.");
}

/**
 * Sends a structured prompt to the Groq Llama 3 API or triggers fallback
 * @param {string} prompt - User request
 * @param {string} systemPrompt - Prompt constraints
 * @returns {Promise<string>} JSON string returned from model
 */
export const queryAi = async (prompt, systemPrompt) => {
  if (!groq) {
    console.log("No Groq API key - triggering frontend/backend cooperative sandbox parser.");
    return fallbackParse(prompt);
  }

  try {
    const response = await groq.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      response_format: { type: "json_object" }
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Groq Llama 3 API Error, falling back to local heuristic parser:", error.message);
    return fallbackParse(prompt);
  }
};

/**
 * Fallback parser in case Groq is not configured or fails
 */
function fallbackParse(text) {
  const lower = text.toLowerCase();
  
  let action = "unknown";
  let amount = 0;
  let token = "ADA";
  let receiverName = null;
  let receiverAddress = null;
  let transactionType = "transfer";
  let schedule = null;
  let confidence = 95;
  let riskLevel = "low";

  // Parse amount
  const amountMatch = text.match(/\b\d+(\.\d+)?\b/);
  if (amountMatch) {
    amount = parseFloat(amountMatch[0]);
  }

  const addressMatch = text.match(/addr(?:_test)?1[a-z0-9]+/i);
  if (addressMatch) {
    receiverAddress = addressMatch[0];
  }

  const receiverMatch = text.match(/\b(?:to|for)\s+([a-zA-Z][a-zA-Z0-9 _-]{1,40}|addr(?:_test)?1[a-z0-9]+)/i);
  if (receiverMatch && !receiverAddress) {
    receiverName = receiverMatch[1].trim().replace(/[.,!?]+$/, "");
  }

  if (!receiverName && lower.includes("rahul")) {
    receiverName = "Rahul";
  } else if (!receiverName && lower.includes("akhil")) {
    receiverName = "Akhil";
  } else if (!receiverName && lower.includes("john")) {
    receiverName = "John";
  } else if (!receiverName && lower.includes("mom")) {
    receiverName = "Mom";
  }

  // Parse action / token
  if (lower.includes("send") || lower.includes("transfer") || lower.includes("pay")) {
    action = "send";
    transactionType = "transfer";
  } else if (lower.includes("swap") || lower.includes("exchange")) {
    action = "swap";
    transactionType = "swap";
    token = "ADA";
  }

  // Parse swap token target
  if (action === "swap") {
    if (lower.includes("usdm")) token = "USDM";
    else if (lower.includes("djed")) token = "DJED";
  }

  // Parse schedules
  if (lower.includes("every friday")) {
    transactionType = "recurring";
    schedule = "every Friday";
  } else if (lower.includes("every month") || lower.includes("monthly") || lower.includes("recurring")) {
    transactionType = "recurring";
    schedule = "monthly";
  } else if (lower.includes("tomorrow") || lower.includes("next week") || lower.includes("schedule")) {
    transactionType = "scheduled";
    schedule = "tomorrow";
  }

  // Suspicious safety trigger in sandbox
  if (lower.includes("scam") || lower.includes("malicious") || lower.includes("urgent") || amount > 10000) {
    riskLevel = amount > 10000 ? "medium" : "high";
  }

  const result = {
    action,
    amount,
    token: action === "swap" ? "ADA" : token,
    receiverName,
    receiverAddress,
    transactionType,
    schedule,
    riskLevel,
    confidence
  };

  return JSON.stringify(result);
}
