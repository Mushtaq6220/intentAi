/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  IntentAi — Intent Safety Validator
 *  smart-contracts/validators/intentValidator.js
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Validates parsed transaction intents before building on-chain transactions.
 *  Acts as the security layer between the AI intent parser and the ledger:
 *
 *    1. Scam keyword detection (social engineering guard)
 *    2. Amount boundary checks (zero, negative, or excessively large)
 *    3. Token support validation (only whitelisted assets allowed)
 *    4. Receiver address format check (bech32 Cardano address)
 *    5. Wallet balance sufficiency check (amount + estimated fee vs balance)
 *    6. Unknown intent guard (action must be a known supported operation)
 *
 *  Risk Levels:
 *    "low"    — safe to proceed with standard confirmation
 *    "medium" — extra caution recommended (warn user)
 *    "high"   — potential scam or large transfer, block unless explicitly confirmed
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { bech32 } from "bech32";

// ── Security Constants ────────────────────────────────────────────────────────

/**
 * Scam and social engineering keywords to detect in raw user prompts.
 * If any of these appear in the prompt, the risk level is raised to HIGH.
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

/**
 * Supported Cardano tokens for real on-chain execution.
 * Tokens not in this list will fail validation for send/transfer actions.
 * Swap operations validate tokens independently via swapService.js.
 */
const SUPPORTED_TOKENS = ["ADA", "USDM", "DJED", "MIN", "IUSD", "INDIGO"];

// ── Address Validation ────────────────────────────────────────────────────────

/**
 * Check if a string looks like a valid Cardano bech32 address.
 * Validates both mainnet (addr1...) and preprod testnet (addr_test1...) formats.
 *
 * @param   {string}  address  Candidate address string
 * @returns {boolean}          true if valid-looking Cardano address
 */
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

// ── Unit Conversion ───────────────────────────────────────────────────────────

/**
 * Convert ADA amount to Lovelace (1 ADA = 1,000,000 Lovelace).
 *
 * @param   {number|string} amountAda  Amount in ADA
 * @returns {number}                   Amount in Lovelace (integer)
 */
export const adaToLovelace = (amountAda) => Math.round(Number(amountAda) * 1_000_000);

// ── Intent Safety Validator ───────────────────────────────────────────────────

/**
 * Validate a parsed transaction intent against all security rules.
 *
 * @param   {object} intent      Parsed intent from the AI intent parser
 * @param   {string} rawPrompt   Original user natural-language input
 * @param   {object} context     Runtime context: { receiverAddress, resolvedFromContact, balanceAda, estimatedFeeAda }
 * @returns {object}             Validation result: { valid, riskLevel, warnings[], errors[] }
 *
 * @example
 * const result = validateIntentSafety(
 *   { action: "send", amount: 50, token: "ADA", receiverName: "Alice" },
 *   "Send 50 ADA to Alice",
 *   { receiverAddress: "addr_test1...", resolvedFromContact: true, balanceAda: 200, estimatedFeeAda: 0.19 }
 * );
 * // result.valid    → true
 * // result.riskLevel → "low"
 */
export const validateIntentSafety = (intent, rawPrompt = "", context = {}) => {
  const result = {
    valid:     true,
    riskLevel: "low",
    warnings:  [],
    errors:    []
  };

  const lowerPrompt     = rawPrompt.toLowerCase();
  const amount          = Number(intent.amount || 0);
  const token           = String(intent.token || "ADA").toUpperCase();
  const receiverAddress = intent.receiverAddress || context.receiverAddress || null;

  // ── Rule 1: Scam Keyword Detection ───────────────────────────────────────
  const foundScamWord = SCAM_KEYWORDS.find(keyword => lowerPrompt.includes(keyword));
  if (foundScamWord) {
    result.riskLevel = "high";
    result.warnings.push(
      `Suspicious keyword "${foundScamWord}" detected. Verify this is not social engineering.`
    );
  }

  // ── Rule 2: Amount Boundary Check ────────────────────────────────────────
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

  // ── Rule 3: Token Support Check ──────────────────────────────────────────
  // Swap actions validate tokens separately in swapService.js — skip here.
  if (intent.action !== "swap" && !SUPPORTED_TOKENS.includes(token)) {
    result.valid = false;
    result.errors.push(
      `Token "${token}" is not supported for real execution yet. This platform supports ADA transfers.`
    );
  }

  // ── Rule 4: Receiver Address Validation ──────────────────────────────────
  if (intent.action === "send" || intent.transactionType === "transfer") {
    if (!receiverAddress) {
      result.valid = false;
      result.errors.push("Receiver address is required.");
    } else if (!isLikelyCardanoAddress(receiverAddress)) {
      result.valid = false;
      result.errors.push("Receiver address is not a valid-looking Cardano bech32 address.");
    }

    // Warn on raw address input (not from trusted contact book)
    if (intent.receiverAddress && !context.resolvedFromContact) {
      result.riskLevel = result.riskLevel === "high" ? "high" : "medium";
      result.warnings.push("Raw address detected. Verify every address character before signing.");
    }
  }

  // ── Rule 5: Unknown Intent Guard ─────────────────────────────────────────
  if (intent.action === "unknown" || !intent.action) {
    result.valid = false;
    result.riskLevel = "medium";
    result.errors.push(
      "Intent parser could not map this request to a supported Cardano operation."
    );
  }

  // ── Rule 6: Balance Sufficiency Check ────────────────────────────────────
  if (typeof context.balanceAda === "number" && amount > 0) {
    const estimatedFeeAda = context.estimatedFeeAda ?? 0.2;
    if (amount + estimatedFeeAda > context.balanceAda) {
      result.valid = false;
      result.errors.push(
        `Insufficient balance. Required about ${amount + estimatedFeeAda} ADA including fees.`
      );
    }
  }

  return result;
};
