import { parseIntent } from "../services/intentParser.js";
import { createTransactionPlan } from "../services/transactionService.js";
import { createSwapPlan } from "../services/swapService.js";
import { queryAi } from "../services/aiService.js";
import { resolveNetwork } from "../services/networkResolver.js";

export const handleParseIntent = async (req, res) => {
  const { prompt, senderAddress, balanceAda } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      success: false,
      error: "Prompt is required and must be a valid text string."
    });
  }

  try {
    const network = resolveNetwork(req);
    const parsedIntent = await parseIntent(prompt);
    
    let transaction;
    if (parsedIntent.action === "swap") {
      transaction = await createSwapPlan({
        intent: parsedIntent,
        rawPrompt: prompt,
        senderAddress,
        balanceAda: typeof balanceAda === "number" ? balanceAda : undefined,
        network
      });
    } else {
      transaction = createTransactionPlan({
        intent: parsedIntent,
        rawPrompt: prompt,
        senderAddress,
        balanceAda: typeof balanceAda === "number" ? balanceAda : undefined,
        network
      });
    }


    return res.status(200).json({
      success: transaction.valid,
      intent: {
        ...parsedIntent,
        receiverName: transaction.receiverName || null,
        receiverAddress: transaction.receiverAddress || null,
        confidence: transaction.confidence,
        riskLevel: transaction.riskLevel,
        safetyValid: transaction.valid,
        safetyWarnings: transaction.warnings || [],
        safetyErrors: transaction.errors || []
      },
      transaction
    });
  } catch (error) {
    console.error("[IntentController] Intent parsing failed:", error);
    return res.status(500).json({
      success: false,
      error: "An internal server error occurred while processing transaction intent.",
      message: error.message
    });
  }
};

export const handleChatConversational = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({
      success: false,
      error: "Prompt is required and must be a valid text string."
    });
  }

  try {
    const network = resolveNetwork(req);
    const CONVERSATIONAL_SYSTEM_PROMPT = `You are a helpful, professional, friendly, and crypto-native AI banking assistant for the Cardano blockchain named ADA Intent AI.
Your ONLY output must be a valid JSON object. Do not include markdown codeblock syntax (no \`\`\`json tags). Return ONLY the JSON object.
Construct a JSON block matching this EXACT schema:
{
  "response": "Your friendly conversational response message here"
}

GUIDELINES:
1. Respond to the user's message in a human-like, natural, and friendly manner.
2. Keep answers relatively concise and highly helpful.
3. If they ask what you can do, explain that you can help them send ADA, perform swaps, manage staking, and view transaction history.
4. If they ask about doing a transaction, tell them how to format their prompt, e.g. "Send 10 ADA to Rahul" or "Swap 50 ADA to USDM".
5. Note: The user is currently on network environment: ${network === "mainnet" ? "Cardano Mainnet" : "Preprod Testnet"}.
   If the network is "mainnet", you MUST naturally include a message/reminder like "You are currently connected to Cardano Mainnet. This transaction will use real ADA and incur real network fees."
   If the network is "preprod", you should naturally remind them that they are in a safe test/sandbox environment.
6. Never output any other text than the requested JSON.`;

    const rawResult = await queryAi(prompt, CONVERSATIONAL_SYSTEM_PROMPT);
    let cleanedResult = rawResult.trim();
    if (cleanedResult.startsWith("```")) {
      cleanedResult = cleanedResult.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
    
    let parsed;
    try {
      parsed = JSON.parse(cleanedResult);
    } catch (parseErr) {
      console.warn("Failed to parse AI conversational JSON, extracting fallback response:", cleanedResult);
      const match = cleanedResult.match(/"response"\s*:\s*"([^"]+)"/);
      if (match) {
        parsed = { response: match[1] };
      } else {
        parsed = { response: cleanedResult };
      }
    }

    const aiText = parsed.response || cleanedResult;

    return res.status(200).json({
      success: true,
      text: aiText
    });
  } catch (error) {
    console.error("[IntentController] Chat conversational routing failed:", error);
    const network = resolveNetwork(req);
    const isMainnet = network === "mainnet";
    const lower = prompt.toLowerCase();
    let text = isMainnet 
      ? "You are currently connected to Cardano Mainnet. Real ADA will be used and real network ledger fees will be incurred."
      : "You are currently connected to Cardano Preprod Testnet. This is a safe sandbox environment for simulation.";
    
    if (lower.includes("hi") || lower.includes("hello") || lower.includes("hey")) {
      text = isMainnet 
        ? "Hello! 👋 I am ready to assist you on Cardano Mainnet. Please be advised that all operations here utilize real funds and incur real ledger fees."
        : "Hey 👋 Welcome to the Cardano Preprod Testnet terminal. How can I help you in this sandbox today?";
    } else if (lower.includes("how are you")) {
      text = "I'm doing excellent — ready to help with your Cardano transfers, DEX swaps, or staking!";
    } else if (lower.includes("what can you do") || lower.includes("help")) {
      text = isMainnet
        ? "I can help you build and sign real Mainnet transfers, interact with DEX swaps, and delegate ADA to real Cardano staking pools using natural English commands!"
        : "I can help you build, sign and test sandbox transfers, DEX swaps, and staking simulations safely in the Preprod Testnet environment.";
    }
    return res.status(200).json({
      success: true,
      text
    });
  }
};

