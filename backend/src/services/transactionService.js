import { config } from "../config/env.js";
import { resolveContactByName } from "./contactService.js";
import { validateIntentSafety, adaToLovelace } from "./validationService.js";

const estimateAdaFee = (transactionType = "transfer") => {
  if (transactionType === "swap") return 0.32;
  if (transactionType === "staking") return 0.17; // Typical delegation fee
  if (transactionType === "recurring" || transactionType === "scheduled") return 0.22;
  return 0.19;
};

export const resolveIntentRecipient = (intent) => {
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

  const contact = resolveContactByName(intent.receiverName);
  return {
    receiverName: contact?.name || intent.receiverName,
    receiverAddress: contact?.address || null,
    contact,
    resolvedFromContact: Boolean(contact)
  };
};

export const createTransactionPlan = ({ intent, rawPrompt = "", senderAddress, balanceAda, network }) => {
  const recipient = resolveIntentRecipient(intent);
  const estimatedFeeAda = estimateAdaFee(intent.transactionType);
  const executableType = intent.transactionType === "transfer" ? "transfer" : intent.transactionType;
  
  // Resolve pool ID for staking
  let poolId = intent.poolId;
  const isMainnet = (network || config.cardanoNetwork) === "mainnet";
  if (executableType === "staking" && !poolId && intent.poolTicker) {
    const ticker = intent.poolTicker.toUpperCase();
    if (isMainnet) {
      if (ticker === "CSP") poolId = "pool1m03c58wepn42ngy7zpmmd76d9006c6xchd20l2256tmm0k37z22"; // Dummy/example for CSP
      if (ticker === "AINF") poolId = "pool15fsvzyj23j53yew0qly2y4a460xedz9763nchhtj2ztsnv987y6";
    } else {
      poolId = "pool1wvsqznmcddtjlgx6z6235n2kly4xchpspsn5q3w6lyeqj6t8fud"; // Mesh default testnet pool
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
