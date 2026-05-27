/**
 * Validation Layer to detect scams, high-value transfers, and bad inputs
 */

const SCAM_KEYWORDS = [
  "urgent",
  "giveaway",
  "lottery",
  "double your",
  "win",
  "seed phrase",
  "private key",
  "security check",
  "verification code",
  "claim reward",
  "admin support"
];

const SUPPORTED_TOKENS = ["ADA", "USDM", "DJED", "MIN", "IUSD", "INDIGO"];

export const isLikelyCardanoAddress = (address = "") => {
  const normalized = String(address).trim().toLowerCase();
  if (!normalized.startsWith("addr_test1") && !normalized.startsWith("addr1")) {
    return false;
  }

  try {
    const decoded = bech32.decode(normalized, 1000);
    return decoded.prefix === "addr_test" || decoded.prefix === "addr";
  } catch {
    return false;
  }
};

export const adaToLovelace = (amountAda) => Math.round(Number(amountAda) * 1_000_000);

/**
 * Validates parsed transaction intents against security rules
 * @param {object} intent - Parsed intent parameters
 * @param {string} rawPrompt - Raw natural language query
 * @returns {object} Safety verification result
 */
export const validateIntentSafety = (intent, rawPrompt = "", context = {}) => {
  const result = {
    valid: true,
    riskLevel: "low",
    warnings: [],
    errors: []
  };

  const lowerPrompt = rawPrompt.toLowerCase();
  const amount = Number(intent.amount || 0);
  const token = String(intent.token || "ADA").toUpperCase();
  const receiverAddress = intent.receiverAddress || context.receiverAddress || null;

  const foundScamWord = SCAM_KEYWORDS.find(keyword => lowerPrompt.includes(keyword));
  if (foundScamWord) {
    result.riskLevel = "high";
    result.warnings.push(`Suspicious keyword "${foundScamWord}" detected. Verify this is not social engineering.`);
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    result.valid = false;
    result.errors.push("Transaction amount must be greater than zero.");
  }

  if (amount > 10000) {
    if (amount > 50000) {
      result.riskLevel = "high";
      result.warnings.push(`Extremely large transfer (${amount} ADA) requested.`);
    } else {
      result.riskLevel = result.riskLevel === "high" ? "high" : "medium";
      result.warnings.push(`Large transfer (${amount} ADA) requested.`);
    }
  }

  // Swap operations validate tokens and paths separately in swapService.js
  if (intent.action !== "swap" && !SUPPORTED_TOKENS.includes(token)) {
    result.valid = false;
    result.errors.push(`Token "${token}" is not supported for real execution yet. This platform supports ADA transfers.`);
  }

  if (intent.action === "send" || intent.transactionType === "transfer") {
    if (!receiverAddress) {
      result.valid = false;
      result.errors.push("Receiver address is required.");
    } else if (!isLikelyCardanoAddress(receiverAddress)) {
      result.valid = false;
      result.errors.push("Receiver address is not a valid-looking Cardano bech32 address.");
    }

    if (intent.receiverAddress && !context.resolvedFromContact) {
      result.riskLevel = result.riskLevel === "high" ? "high" : "medium";
      result.warnings.push("Raw address detected. Verify every address character before signing.");
    }
  }

  if (intent.action === "unknown" || !intent.action) {
    result.valid = false;
    result.riskLevel = "medium";
    result.errors.push("Intent parser could not map this request to a supported Cardano operation.");
  }

  if (typeof context.balanceAda === "number" && amount > 0) {
    const estimatedFeeAda = context.estimatedFeeAda ?? 0.2;
    if (amount + estimatedFeeAda > context.balanceAda) {
      result.valid = false;
      result.errors.push(`Insufficient balance. Required about ${amount + estimatedFeeAda} ADA including fees.`);
    }
  }

  return result;
};
import { bech32 } from "bech32";
