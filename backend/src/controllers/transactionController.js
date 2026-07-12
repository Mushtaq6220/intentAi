import { parseIntent } from "../services/intentParser.js";
import { createTransactionPlan, validateSubmittedHash } from "../services/transactionService.js";
import { bech32 } from "bech32";

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

// ── MINSWAP V2 PREPROD ORDER BUILDER ─────────────────────────────────────────
// Minswap V2 Order Script Hash on Preprod Testnet (Cardano preprod network)
// Enterprise address derived from script hash: addr_test1wrp79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqtr7yyv
const MINSWAP_V2_ORDER_ADDRESS_PREPROD =
  "addr_test1wrp79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqtr7yyv";

// Known preprod token metadata
const PREPROD_TOKENS = {
  ADA:   { policyId: "",                                                                   tokenNameHex: "" },
  MIN:   { policyId: "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72",              tokenNameHex: "4d494e" },
  USDM:  { policyId: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",              tokenNameHex: "0014df105553444d" },
  DJED:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",              tokenNameHex: "1444a4544" },
  SHEN:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",              tokenNameHex: "15348454e" },
};

// ── MINSWAP V2 MAINNET ORDER BUILDER ─────────────────────────────────────────
// Minswap V2 Order Script address on Cardano Mainnet
// Derived from Minswap V2 validator script hash on mainnet
const MINSWAP_V2_ORDER_ADDRESS_MAINNET =
  "addr1z9ghva67a45s6zyt62we56f5k834auwcjl0tv8tmth0prjjj2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pqsk3urw";

// Mainnet token policy IDs — real Cardano mainnet verified policy IDs
const MAINNET_TOKENS = {
  ADA:   { policyId: "",                                                                   tokenNameHex: "" },
  MIN:   { policyId: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",              tokenNameHex: "4d494e" },
  USDM:  { policyId: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",              tokenNameHex: "0014df105553444d" },
  DJED:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",              tokenNameHex: "1444a4544" },
  SHEN:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",              tokenNameHex: "15348454e" },
  HOSKY: { policyId: "a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481ef0",              tokenNameHex: "484f534b59" },
  WMT:   { policyId: "1d7f33bd23d85e1a25d87d86fac4f199c3197a2f7afeb662a0f34e1e",              tokenNameHex: "776f726c646d6f62696c65746f6b656e" },
  AGIX:  { policyId: "f43a62fdc3965df486de8a0d32fe800963589c4b64d3dcb6f8dbe36f",              tokenNameHex: "41474958" },
};

/**
 * Decode bech32 Cardano address and extract the payment credential (pubKeyHash or scriptHash)
 * Works for enterprise (addr_test1v...) and base (addr_test1q...) addresses.
 */
function extractPaymentCredential(bech32Addr) {
  const decoded = bech32.decode(bech32Addr, 1000);
  const payloadBytes = Buffer.from(bech32.fromWords(decoded.words));
  // Byte 0 = header; bytes 1-28 = 28-byte payment credential
  return payloadBytes.slice(1, 29).toString("hex");
}

/**
 * Encode a Cardano enterprise Address (PubKeyCredential only, no staking)
 * as a Mesh SDK PlutusData constructor value.
 *
 * IMPORTANT: Mesh SDK Data type uses:
 *   - plain string  → CBOR ByteString (for paymentKeyHash, policyId, tokenName)
 *   - plain number  → CBOR Integer    (for lovelace amounts, minimumReceive)
 *   - { alternative: N, fields: Data[] } → CBOR Constructor
 * Do NOT use { bytes: x } or { int: x } wrapper objects — they cause
 * "Cannot convert undefined to a BigInt" in the Mesh SDK serializer.
 */
function encodePlutusAddress(paymentKeyHash) {
  return {
    alternative: 0, // Address
    fields: [
      {
        alternative: 0, // PubKeyCredential
        fields: [paymentKeyHash]  // plain hex string = CBOR ByteString
      },
      {
        alternative: 1, // Nothing (no staking credential)
        fields: []
      }
    ]
  };
}

/**
 * Build a Minswap V2 OrderDatum (SWAP_EXACT_IN) as a Mesh SDK PlutusData object.
 * Fields match the Minswap V2 Aiken contract on-chain:
 *   sender, receiver, receiverDatumHash, step (SWAP_EXACT_IN), batcherFee, depositADA
 */
function buildMinswapV2Datum(paymentKeyHash, toPolicyId, toTokenNameHex, minAmountOut) {
  const addrData = encodePlutusAddress(paymentKeyHash);

  // Step: SWAP_EXACT_IN = constructor 0
  // Asset fields: policyId and tokenName as plain strings (CBOR ByteString)
  // minimumReceive as plain number (CBOR Integer)
  const step = {
    alternative: 0, // SWAP_EXACT_IN
    fields: [
      {
        alternative: 0, // Asset
        fields: [
          toPolicyId,     // plain hex string = CBOR ByteString (CurrencySymbol)
          toTokenNameHex  // plain hex string = CBOR ByteString (TokenName)
        ]
      },
      minAmountOut  // plain number = CBOR Integer (minimumReceive)
    ]
  };

  return {
    alternative: 0, // OrderDatum constructor 0
    fields: [
      addrData,                         // sender (canceller address)
      addrData,                         // receiver (output destination)
      { alternative: 1, fields: [] },   // receiverDatumHash: Nothing
      step,                             // step: SWAP_EXACT_IN
      2000000,                          // batcherFee: 2 ADA (plain number)
      2000000                           // depositADA: 2 ADA  (plain number)
    ]
  };
}

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


