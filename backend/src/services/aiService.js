import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "../config/env.js";

let genAI = null;
let model = null;

if (config.geminiApiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.geminiApiKey);
    model = genAI.getGenerativeModel({
      model: config.geminiModel,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });
    console.log(`Gemini AI SDK successfully initialized with model: ${config.geminiModel}`);
  } catch (err) {
    console.error("Failed to initialize Gemini SDK:", err.message);
  }
} else {
  console.log("Note: GEMINI_API_KEY is empty. The backend will operate in fallback sandbox mode.");
}

/**
 * Sends a structured prompt to the Gemini API or triggers the heuristic fallback
 * @param {string} prompt - User request
 * @param {string} systemPrompt - Prompt constraints / schema definition
 * @returns {Promise<string>} JSON string returned from model
 */
export const queryAi = async (prompt, systemPrompt) => {
  const isChat = systemPrompt && (systemPrompt.includes('"response"') || systemPrompt.includes('banking assistant'));

  if (!model) {
    console.log("No Gemini API key — triggering frontend/backend cooperative sandbox parser.");
    return isChat ? fallbackChat(prompt, systemPrompt) : fallbackParse(prompt);
  }

  try {
    // Gemini SDK uses system instruction + user message
    const result = await model.generateContent({
      systemInstruction: systemPrompt,
      contents: [
        { role: "user", parts: [{ text: prompt }] }
      ],
    });

    const text = result.response.text();
    return text;
  } catch (error) {
    console.error("Gemini API Error, falling back to local heuristic parser:", error.message);
    return isChat ? fallbackChat(prompt, systemPrompt) : fallbackParse(prompt);
  }
};

/**
 * Fallback heuristic parser used when Gemini is not configured or fails.
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

  const amountMatch = text.match(/\b\d+(\.\d+)?\b/);
  if (amountMatch) amount = parseFloat(amountMatch[0]);

  const addressMatch = text.match(/addr(?:_test)?1[a-z0-9]+/i);
  if (addressMatch) receiverAddress = addressMatch[0];

  const receiverMatch = text.match(/\b(?:to|for)\s+([a-zA-Z][a-zA-Z0-9 _-]{1,40})/i);
  if (receiverMatch && !receiverAddress) receiverName = receiverMatch[1].trim().replace(/[.,!?]+$/, "");

  if (!receiverName) {
    if (lower.includes("rahul"))  receiverName = "Rahul";
    else if (lower.includes("akhil")) receiverName = "Akhil";
    else if (lower.includes("john"))  receiverName = "John";
    else if (lower.includes("mom"))   receiverName = "Mom";
  }

  if (lower.includes("send") || lower.includes("transfer") || lower.includes("pay")) {
    action = "send"; transactionType = "transfer";
  } else if (lower.includes("swap") || lower.includes("exchange") || lower.includes("convert")) {
    action = "swap"; transactionType = "swap";
  } else if (lower.includes("stake") || lower.includes("delegate")) {
    action = "stake"; transactionType = "staking";
  }
  let fromToken = null, toToken = null;
  if (action === "swap") {
    // Attempt regex extraction first for general tokens
    const swapRegex = /(?:swap|convert|exchange)\s+(\d+(?:\.\d+)?)\s+([a-zA-Z0-9$]+)\s+(?:to|into|for)\s+([a-zA-Z0-9$]+)/i;
    const swapNoAmountRegex = /(?:swap|convert|exchange)\s+([a-zA-Z0-9$]+)\s+(?:to|into|for)\s+([a-zA-Z0-9$]+)/i;
    
    let match = lower.match(swapRegex);
    if (match) {
      amount = parseFloat(match[1]);
      fromToken = match[2].toUpperCase();
      toToken = match[3].toUpperCase();
    } else {
      match = lower.match(swapNoAmountRegex);
      if (match) {
        fromToken = match[1].toUpperCase();
        toToken = match[2].toUpperCase();
      }
    }

    // Fallback if regex match fails
    if (!fromToken || !toToken) {
      const cardanoTokens = ["ada", "usdm", "djed", "min", "wmt", "shen"];
      const found = [];
      cardanoTokens.forEach(t => {
        const idx = lower.indexOf(t);
        if (idx !== -1) {
          found.push({ symbol: t.toUpperCase(), index: idx });
        }
      });
      found.sort((a, b) => a.index - b.index);

      if (found.length >= 2) {
        fromToken = found[0].symbol;
        toToken = found[1].symbol;
      } else if (found.length === 1) {
        fromToken = found[0].symbol;
        toToken = fromToken === "ADA" ? "USDM" : "ADA";
      } else {
        fromToken = "ADA";
        toToken = "USDM";
      }
    }
    token = fromToken;
  }

  if (lower.includes("every friday")) {
    transactionType = "recurring"; schedule = "every Friday";
  } else if (lower.includes("monthly") || lower.includes("recurring")) {
    transactionType = "recurring"; schedule = "monthly";
  } else if (lower.includes("tomorrow") || lower.includes("schedule")) {
    transactionType = "scheduled"; schedule = "tomorrow";
  }

  if (lower.includes("scam") || lower.includes("malicious") || amount > 10000) {
    riskLevel = amount > 10000 ? "medium" : "high";
  }

  return JSON.stringify({
    action, amount,
    token: action === "swap" ? fromToken : token,
    fromToken: action === "swap" ? fromToken : null,
    toToken: action === "swap" ? toToken : null,
    receiverName, receiverAddress,
    transactionType, schedule, riskLevel, confidence
  });
}

/**
 * Fallback conversational chat responses when Gemini fails or is not configured
 */
function fallbackChat(text, systemPrompt) {
  const isMainnet = systemPrompt && systemPrompt.toLowerCase().includes("mainnet");
  const lower = text.toLowerCase();
  
  let responseText = isMainnet 
    ? "You are currently connected to Cardano Mainnet. Real ADA will be used and real network ledger fees will be incurred."
    : "You are currently connected to Cardano Preprod Testnet. This is a safe sandbox environment for simulation.";
  
  if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
    responseText = isMainnet 
      ? "Hello! 👋 I am ready to assist you on Cardano Mainnet. Please be advised that all operations here utilize real funds and incur real ledger fees."
      : "Hey 👋 Welcome to the Cardano Preprod Testnet terminal. How can I help you in this sandbox today?";
  } else if (lower.includes("how are you")) {
    responseText = "I'm doing excellent — ready to help with your Cardano transfers, DEX swaps, or staking!";
  } else if (lower.includes("what can you do") || lower.includes("help")) {
    responseText = isMainnet
      ? "I can help you build and sign real Mainnet transfers, interact with DEX swaps, and delegate ADA to real Cardano staking pools using natural English commands!"
      : "I can help you build, sign and test sandbox transfers, DEX swaps, and staking simulations safely in the Preprod Testnet environment.";
  } else {
    responseText = "I'm here to help you navigate and transact on Cardano!";
  }

  return JSON.stringify({ response: responseText });
}

