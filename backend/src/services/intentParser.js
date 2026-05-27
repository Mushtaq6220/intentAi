import { queryAi } from "./aiService.js";

const SYSTEM_PROMPT = `You are a Cardano blockchain transaction parser AI.
Your ONLY output must be a valid JSON object. Do not include markdown codeblock syntax (no \`\`\`json tags), do not include any header comments, do not include greetings or follow-up remarks. Return ONLY the JSON object.

Extract transaction parameters from the user's natural language instruction.
Parse and construct a JSON block matching this EXACT schema:
{
  "action": "send" | "swap" | "recurring" | "schedule" | "stake" | "unstake" | "claim_rewards" | "unknown",
  "amount": number,
  "token": "ADA" | "USDM" | "DJED" | string,
  "fromToken": "ADA" | "USDM" | "DJED" | "MIN" | "IUSD" | string | null,
  "toToken": "ADA" | "USDM" | "DJED" | "MIN" | "IUSD" | string | null,
  "receiverName": string | null,
  "receiverAddress": string | null,
  "poolTicker": string | null (e.g. "CSP" or "AINF" or validators if specified),
  "poolId": string | null,
  "transactionType": "transfer" | "swap" | "recurring" | "scheduled" | "staking",
  "schedule": string | null (e.g. "monthly", "tomorrow", or null if immediate),
  "riskLevel": "low" | "medium" | "high",
  "confidence": number (an integer between 0 and 100 representing how confident you are in this parsing)
}

GUIDELINES:
1. "action":
   - "send" for direct transfers or payment schedules.
   - "swap" for token-to-token conversions (e.g. ADA to USDM).
   - "recurring" for ongoing subscriptions or continuous payments.
   - "schedule" for single delayed future transactions.
   - "stake" for delegation of ADA to a staking pool (e.g. "Stake 200 ADA", "Delegate to validator").
   - "unstake" for withdrawing delegation or de-registering stake key (e.g. "Unstake 100 ADA", "Unstake from pool").
   - "claim_rewards" for withdrawing staking rewards (e.g. "Claim staking rewards", "Show my rewards").
2. "amount": Extract as a positive floating point number. If unspecified, default to 0.
3. "token": Identify the transacted token. Standard is ADA.
4. "fromToken": For swap action, identify the input token to convert FROM (e.g., ADA). Set null for non-swap.
5. "toToken": For swap action, identify the output token to convert TO (e.g., USDM, DJED, MIN, IUSD). Set null for non-swap.
6. "receiverName": Extract contact name. For raw addresses, set this to null.
7. "receiverAddress": Extract raw Cardano address only if the user typed one. Otherwise set null.
8. "poolTicker": For staking actions, extract the validator pool ticker (e.g. "CSP", "AINF", "WAVE") if mentioned. Otherwise set null.
9. "transactionType": Match "transfer", "swap", "recurring", "scheduled", or "staking".
10. "schedule": If "every Friday", set "every Friday". If "tomorrow", set "tomorrow". Otherwise set null.
11. "riskLevel": Set "high" if prompt asks for suspicious actions. Set "medium" for unknown addresses. Otherwise default to "low".
12. "confidence": Set score based on prompt clarity. E.g. "Stake 200 ADA" is 98. "Unstake from pool" is 95.

Never output any other text than the requested JSON.`;


/**
 * Parses user input into transaction parameters using Groq Llama 3
 * @param {string} text - The natural language intent
 * @returns {Promise<object>} The parsed intent parameters
 */
export const parseIntent = async (text) => {
  try {
    const rawResult = await queryAi(text, SYSTEM_PROMPT);
    
    // Clean potential markdown or extra spaces surrounding the JSON response
    let cleanedResult = rawResult.trim();
    if (cleanedResult.startsWith("```")) {
      cleanedResult = cleanedResult.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
    
    const parsed = JSON.parse(cleanedResult);
    return normalizeIntent(parsed);
  } catch (error) {
    console.error("Intent parsing parseError:", error.message);
    // Return a default error intent object instead of throwing
    return {
      action: "unknown",
      amount: 0,
      token: "ADA",
      fromToken: null,
      toToken: null,
      receiverName: null,
      receiverAddress: null,
      transactionType: "transfer",
      schedule: null,
      riskLevel: "high",
      confidence: 10
    };
  }
};

const normalizeIntent = (intent) => {
  const receiverName = intent.receiverName ?? (
    intent.receiver && !String(intent.receiver).startsWith("addr") ? intent.receiver : null
  );
  const receiverAddress = intent.receiverAddress ?? (
    intent.receiver && String(intent.receiver).startsWith("addr") ? intent.receiver : null
  );
  const isStaking = ["stake", "unstake", "claim_rewards"].includes(intent.action);
  const transactionType =
    intent.transactionType === "schedule"
      ? "scheduled"
      : isStaking
      ? "staking"
      : intent.transactionType || "transfer";

  return {
    action: intent.action || "unknown",
    amount: Number(intent.amount || 0),
    token: String(intent.token || "ADA").toUpperCase(),
    fromToken: intent.fromToken ? String(intent.fromToken).toUpperCase() : (intent.action === "swap" ? "ADA" : null),
    toToken: intent.toToken ? String(intent.toToken).toUpperCase() : null,
    receiverName,
    receiverAddress,
    poolTicker: intent.poolTicker ?? null,
    poolId: intent.poolId ?? null,
    transactionType,
    schedule: intent.schedule ?? null,
    riskLevel: intent.riskLevel || "medium",
    confidence: Math.max(0, Math.min(100, Number(intent.confidence || 0)))
  };
};

