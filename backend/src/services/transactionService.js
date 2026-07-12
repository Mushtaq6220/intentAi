import { config } from "../config/env.js";
import { resolveContactByName } from "./contactService.js";
import { validateIntentSafety, adaToLovelace } from "./validationService.js";

const estimateAdaFee = (transactionType = "transfer") => {
  if (transactionType === "swap") return 0.32;
  if (transactionType === "staking") return 0.17; // Typical delegation fee
  if (transactionType === "recurring" || transactionType === "scheduled") return 0.22;
  return 0.19;
};

export const resolveIntentRecipient = async (intent, walletAddress) => {
  if (intent.receiverAddress) {
    return {
      receiverName: intent.receiverName || "Raw Cardano address",
      receiverAddress: intent.receiverAddress,
      contact: null,
      resolvedFromContact: false
    };
  }

  if (!intent.receiverName) {
    return {
      receiverName: null,
      receiverAddress: null,
      contact: null,
      resolvedFromContact: false
    };
  }

  const contact = await resolveContactByName(intent.receiverName, walletAddress);
  return {
    receiverName: contact?.name || intent.receiverName,
    receiverAddress: contact?.address || null,
    contact,
    resolvedFromContact: Boolean(contact)
  };
};

export const createTransactionPlan = async ({ intent, rawPrompt = "", senderAddress, balanceAda, network }) => {
  const recipient = await resolveIntentRecipient(intent, senderAddress);
  const estimatedFeeAda = estimateAdaFee(intent.transactionType);
  const executableType = intent.transactionType === "transfer" ? "transfer" : intent.transactionType;
  
  // Resolve pool ID for staking
  let poolId = intent.poolId;
  const isMainnet = (network || config.cardanoNetwork) === "mainnet";
  if (executableType === "staking" && !poolId && intent.poolTicker) {
    const ticker = intent.poolTicker.toUpperCase();
    if (isMainnet) {
      if (ticker === "SANO") poolId = "pool1wnnxuqkftm7z593s0tsnfxtq9069zup9slyndxryj4wun5g5xwe";
      if (ticker === "WAVE") poolId = "pool1pu5jlj4q9w9cjmllnmv4y0v6q96j22z3m33lq4c7v9j05t78044";
    } else {
      if (ticker === "CSP") poolId = "pool1wnnxuqkftm7z593s0tsnfxtq9069zup9slyndxryj4wun5g5xwe";
      if (ticker === "AINF") poolId = "pool1pu5jlj4q9w9cjmllnmv4y0v6q96j22z3m33lq4c7v9j05t78044";
      if (ticker === "OCEAN") poolId = "pool1lsvh87jnkstudnvgzsm7j9jnrdlhwvhddkxkjp2y59pmzsn38yy";
      if (ticker === "NEBLA") poolId = "pool1z5uqdk7dzdxaae5633fqfcu2eqzy3a3rgqrl4daqk5p08lcz4a0";
      if (ticker === "SMMT") poolId = "pool1y24nj4qdkg35nvvnfawukauggsxrxuy74876cplmxfymx7t3eg";
      if (ticker === "AURORA") poolId = "pool12t3v2hxrpxynxpv6kqh54r3j6g7lz3g6lmqkqn2jy3qqyp0qt0";
      
      // Fallback
      if (!poolId) poolId = "pool1wvsqznmcddtjlgx6z6235n2kly4xchpspsn5q3w6lyeqj6t8fud";
    }
  }

  const validation = validateIntentSafety(
    {
      ...intent,
      receiverName: recipient.receiverName,
      receiverAddress: recipient.receiverAddress
    },
    rawPrompt,
    {
      receiverAddress: recipient.receiverAddress,
      resolvedFromContact: recipient.resolvedFromContact,
      balanceAda,
      estimatedFeeAda
    }
  );

  if ((intent.action === "send" || intent.transactionType === "transfer") && !recipient.resolvedFromContact && !intent.receiverAddress) {
    validation.valid = false;
    validation.errors.push(`Contact "${intent.receiverName || "unknown"}" was not found.`);
  }

  const riskLevel =
    validation.riskLevel === "high" || intent.riskLevel === "high"
      ? "high"
      : validation.riskLevel === "medium" || intent.riskLevel === "medium"
        ? "medium"
        : "low";

  return {
    valid: validation.valid,
    network: network || config.cardanoNetwork,
    transactionType: executableType,

    action: intent.action,
    token: intent.token,
    amount: intent.amount,
    amountLovelace: adaToLovelace(intent.amount),
    receiverName: recipient.receiverName,
    receiverAddress: recipient.receiverAddress,
    resolvedFromContact: recipient.resolvedFromContact,
    contactId: recipient.contact?.id || null,
    poolTicker: intent.poolTicker,
    poolId,
    schedule: intent.schedule,
    estimatedFeeAda,
    confidence: intent.confidence,
    riskLevel,
    warnings: validation.warnings,
    errors: validation.errors,
    walletExecution: {
      builder: "Mesh SDK Transaction",
      signing: "CIP-30 wallet.signTx()",
      submission: "CIP-30 wallet.submitTx()",
      requiresWallet: true,
      senderAddress: senderAddress || null
    }
  };
};

export const validateSubmittedHash = (txHash = "") => /^[a-f0-9]{64}$/i.test(String(txHash));
