import { parseIntent } from "../services/intentParser.js";
import { createTransactionPlan, validateSubmittedHash } from "../services/transactionService.js";
import {
  MINSWAP_V2_ORDER_ADDRESS_PREPROD,
  MINSWAP_V2_ORDER_ADDRESS_MAINNET,
  PREPROD_TOKENS,
  MAINNET_TOKENS,
  BATCHER_FEE_LOVELACE,
  DEPOSIT_ADA_LOVELACE,
  extractPaymentCredential,
  buildMinswapV2Datum
} from "../../../../smart-contracts/index.js";

export const handleCreateTransaction = async (req, res) => {
  const { prompt, intent: suppliedIntent, senderAddress, balanceAda } = req.body;

  if (!prompt && !suppliedIntent) {
    return res.status(400).json({
      success: false,
      error: "Either 'prompt' or 'intent' is required."
    });
  }

  try {
    const intent = suppliedIntent || await parseIntent(prompt);
    const transaction = createTransactionPlan({
      intent,
      rawPrompt: prompt || "",
      senderAddress,
      balanceAda: typeof balanceAda === "number" ? balanceAda : undefined
    });

    return res.status(transaction.valid ? 200 : 422).json({
      success: transaction.valid,
      intent: {
        ...intent,
        receiverName: transaction.receiverName,
        receiverAddress: transaction.receiverAddress,
        confidence: transaction.confidence,
        riskLevel: transaction.riskLevel
      },
      transaction,
      error: transaction.valid ? undefined : transaction.errors.join(" ")
    });
  } catch (error) {
    console.error("[TransactionController] Failed to create transaction plan:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create transaction plan.",
      message: error.message
    });
  }
};

export const handleBuildSwapTransaction = async (req, res) => {
  const { sender, min_amount_out, estimate } = req.body;

  if (!sender || !min_amount_out || !estimate) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: sender, min_amount_out, estimate"
    });
  }

  try {
    const response = await fetch("https://agg-api.minswap.org/aggregator/build-tx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender,
        min_amount_out,
        estimate
      })
    });

    const data = await response.json();

    if (response.ok && data.cbor) {
      return res.status(200).json({
        success: true,
        cbor: data.cbor
      });
    } else {
      return res.status(response.status || 400).json({
        success: false,
        error: data.message || "Failed to build swap transaction via Minswap Aggregator API."
      });
    }
  } catch (error) {
    console.error("[TransactionController] Failed to build swap transaction:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during swap transaction construction",
      message: error.message
    });
  }
};


export const handleBuildPreprodSwapOrder = async (req, res) => {
  const { senderAddress, fromToken, toToken, amount, minAmountOut } = req.body;

  if (!senderAddress || !toToken || !amount) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: senderAddress, toToken, amount"
    });
  }

  try {
    // Extract 28-byte payment credential (pubKeyHash) from the bech32 wallet address
    let paymentKeyHash;
    try {
      paymentKeyHash = extractPaymentCredential(senderAddress);
    } catch (addrErr) {
      return res.status(400).json({
        success: false,
        error: `Invalid Cardano wallet address: ${addrErr.message}`
      });
    }

    // Resolve output token metadata
    const toTokenKey = String(toToken).toUpperCase();
    const tokenMeta = PREPROD_TOKENS[toTokenKey];
    if (!tokenMeta || toTokenKey === "ADA") {
      return res.status(400).json({
        success: false,
        error: `Token '${toToken}' is not supported for preprod on-chain swap orders. Supported: MIN, USDM, DJED, SHEN`
      });
    }

    // Calculate lovelace amounts
    const fromTokenKey = String(fromToken || "ADA").toUpperCase();
    const swapLovelace = fromTokenKey === "ADA" ? Math.floor(Number(amount) * 1_000_000) : 0;
    const batcherFee   = 2_000_000; // 2 ADA
    const depositADA   = 2_000_000; // 2 ADA
    const totalLovelace = swapLovelace + batcherFee + depositADA;

    // Build the Minswap V2 datum with resolved minimum receive
    const resolvedMinOut = minAmountOut ? Math.floor(Number(minAmountOut)) : 0;
    const datum = buildMinswapV2Datum(
      paymentKeyHash,
      tokenMeta.policyId,
      tokenMeta.tokenNameHex,
      resolvedMinOut
    );

    return res.status(200).json({
      success: true,
      orderAddress: MINSWAP_V2_ORDER_ADDRESS_PREPROD,
      datum,
      amountLovelace: totalLovelace,
      swapLovelace,
      batcherFee,
      depositADA,
      paymentKeyHash
    });
  } catch (error) {
    console.error("[TransactionController] Failed to build preprod swap order:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error building preprod swap order",
      message: error.message
    });
  }
};

// ── MAINNET ORDER HANDLER ────────────────────────────────────────────────────
export const handleBuildMainnetSwapOrder = async (req, res) => {
  const { senderAddress, fromToken, toToken, amount, minAmountOut } = req.body;

  if (!senderAddress || !toToken || !amount) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: senderAddress, toToken, amount"
    });
  }

  // Validate it's a real mainnet address (starts with addr1, not addr_test)
  if (!senderAddress.startsWith("addr1")) {
    return res.status(400).json({
      success: false,
      error: "Mainnet swap requires a mainnet wallet address (starting with addr1). Your address appears to be a testnet address."
    });
  }

  try {
    let paymentKeyHash;
    try {
      paymentKeyHash = extractPaymentCredential(senderAddress);
    } catch (addrErr) {
      return res.status(400).json({
        success: false,
        error: `Invalid Cardano mainnet wallet address: ${addrErr.message}`
      });
    }

    const toTokenKey = String(toToken).toUpperCase();
    const tokenMeta = MAINNET_TOKENS[toTokenKey];
    if (!tokenMeta || toTokenKey === "ADA") {
      return res.status(400).json({
        success: false,
        error: `Token '${toToken}' is not supported for mainnet on-chain swap orders. Supported: MIN, USDM, DJED, SHEN, HOSKY, WMT, AGIX`
      });
    }

    const fromTokenKey = String(fromToken || "ADA").toUpperCase();
    const swapLovelace = fromTokenKey === "ADA" ? Math.floor(Number(amount) * 1_000_000) : 0;
    const batcherFee   = 2_000_000; // 2 ADA
    const depositADA   = 2_000_000; // 2 ADA
    const totalLovelace = swapLovelace + batcherFee + depositADA;

    const resolvedMinOut = minAmountOut ? Math.floor(Number(minAmountOut)) : 0;
    const datum = buildMinswapV2Datum(
      paymentKeyHash,
      tokenMeta.policyId,
      tokenMeta.tokenNameHex,
      resolvedMinOut
    );

    return res.status(200).json({
      success: true,
      orderAddress: MINSWAP_V2_ORDER_ADDRESS_MAINNET,
      datum,
      amountLovelace: totalLovelace,
      swapLovelace,
      batcherFee,
      depositADA,
      paymentKeyHash
    });
  } catch (error) {
    console.error("[TransactionController] Failed to build mainnet swap order:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error building mainnet swap order",
      message: error.message
    });
  }
};

export const handleSubmitTransaction = async (req, res) => {
  const { txHash, signedTxHex } = req.body;

  if (!txHash && !signedTxHex) {
    return res.status(400).json({
      success: false,
      error: "Provide txHash after wallet.submitTx(), or signedTxHex for a server-side relay integration."
    });
  }

  if (txHash && !validateSubmittedHash(txHash)) {
    return res.status(400).json({
      success: false,
      error: "Transaction hash must be a 64-character hexadecimal Cardano transaction hash."
    });
  }

  return res.status(200).json({
    success: true,
    txHash: txHash || null,
    relayedBy: txHash ? "wallet.submitTx" : "not-relayed",
    message: txHash
      ? "Wallet submitted the transaction to Cardano preprod successfully."
      : "Signed transaction received. This backend intentionally does not relay raw signed transactions in the MVP."
  });
};


