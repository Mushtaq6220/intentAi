/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  IntentAi — Minswap V2 Order Datum Builder
 *  smart-contracts/validators/minswapV2Datum.js
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  This module encodes on-chain Plutus data for a Minswap V2 SWAP_EXACT_IN
 *  order. The OrderDatum is constructed according to the Minswap V2 Aiken
 *  validator schema:
 *
 *  OrderDatum {
 *    sender          : Address,          // canceller / refund destination
 *    receiver        : Address,          // output destination after swap
 *    receiverDatumHash : Option<Hash>,   // Nothing for direct wallet output
 *    step            : Step,             // SWAP_EXACT_IN | SWAP_EXACT_OUT | ...
 *    batcherFee      : Int,              // Lovelace paid to batcher (2 ADA)
 *    depositADA      : Int               // Lovelace deposited with order (2 ADA)
 *  }
 *
 *  Reference: https://github.com/minswap/minswap-dex-v2
 * ══════════════════════════════════════════════════════════════════════════════
 */

import { bech32 } from "bech32";

// ── On-Chain Order Script Addresses ──────────────────────────────────────────

/**
 * Minswap V2 Order Script Address — Cardano Preprod Testnet
 * Enterprise address derived from the Minswap V2 validator script hash.
 */
export const MINSWAP_V2_ORDER_ADDRESS_PREPROD =
  "addr_test1wrp79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqtr7yyv";

/**
 * Minswap V2 Order Script Address — Cardano Mainnet
 * Derived from the Minswap V2 validator script hash on mainnet.
 */
export const MINSWAP_V2_ORDER_ADDRESS_MAINNET =
  "addr1z9ghva67a45s6zyt62we56f5k834auwcjl0tv8tmth0prjjj2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pqsk3urw";

// ── Token Registry — Preprod Testnet ─────────────────────────────────────────
/**
 * Cardano Preprod testnet token metadata.
 * policyId and tokenNameHex must match exactly the on-chain asset class.
 */
export const PREPROD_TOKENS = {
  ADA:   { policyId: "",                                                              tokenNameHex: "" },
  MIN:   { policyId: "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed72",     tokenNameHex: "4d494e" },
  USDM:  { policyId: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",     tokenNameHex: "0014df105553444d" },
  DJED:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",      tokenNameHex: "1444a4544" },
  SHEN:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",      tokenNameHex: "15348454e" },
};

// ── Token Registry — Mainnet ──────────────────────────────────────────────────
/**
 * Cardano Mainnet verified token policy IDs.
 * All policy IDs verified on-chain via cardanoscan.io.
 */
export const MAINNET_TOKENS = {
  ADA:   { policyId: "",                                                              tokenNameHex: "" },
  MIN:   { policyId: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c6",     tokenNameHex: "4d494e" },
  USDM:  { policyId: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad",     tokenNameHex: "0014df105553444d" },
  DJED:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",      tokenNameHex: "1444a4544" },
  SHEN:  { policyId: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd6",      tokenNameHex: "15348454e" },
  HOSKY: { policyId: "a0028f350aaabe0545fdcb56b039bfb08e4bb4d8c4d7c3c7d481ef0",      tokenNameHex: "484f534b59" },
  WMT:   { policyId: "1d7f33bd23d85e1a25d87d86fac4f199c3197a2f7afeb662a0f34e1e",    tokenNameHex: "776f726c646d6f62696c65746f6b656e" },
  AGIX:  { policyId: "f43a62fdc3965df486de8a0d32fe800963589c4b64d3dcb6f8dbe36f",     tokenNameHex: "41474958" },
};

// ── Batcher / Deposit Constants ───────────────────────────────────────────────
export const BATCHER_FEE_LOVELACE = 2_000_000;   // 2 ADA — paid to Minswap batcher
export const DEPOSIT_ADA_LOVELACE = 2_000_000;   // 2 ADA — deposited alongside the order UTxO

// ── Address Utility ───────────────────────────────────────────────────────────

/**
 * Decode a bech32 Cardano address and extract the 28-byte payment credential
 * (pubKeyHash for wallet addresses, scriptHash for script addresses).
 *
 * Works for:
 *   - Enterprise addresses: addr_test1v... / addr1v...
 *   - Base addresses:       addr_test1q... / addr1q...
 *
 * @param   {string} bech32Addr  Bech32-encoded Cardano wallet address
 * @returns {string}             28-byte payment credential as lowercase hex
 */
export function extractPaymentCredential(bech32Addr) {
  const decoded      = bech32.decode(bech32Addr, 1000);
  const payloadBytes = Buffer.from(bech32.fromWords(decoded.words));
  // Byte 0 = header byte (encodes address type + network)
  // Bytes 1–28 = 28-byte payment credential
  return payloadBytes.slice(1, 29).toString("hex");
}

// ── Plutus Data Encoders ──────────────────────────────────────────────────────

/**
 * Encode a Cardano enterprise address as a Plutus Data constructor.
 *
 * Plutus representation:
 *   Address {
 *     paymentCredential: PubKeyCredential(pubKeyHash),
 *     stakingCredential: Nothing
 *   }
 *
 * NOTE: Mesh SDK PlutusData encoding rules used throughout:
 *   - plain string  →  CBOR ByteString  (paymentKeyHash, policyId, tokenName)
 *   - plain number  →  CBOR Integer     (lovelace, minimumReceive)
 *   - { alternative, fields } → CBOR Constructor
 * Do NOT use { bytes: x } or { int: x } wrappers — they cause
 * "Cannot convert undefined to BigInt" in the Mesh SDK serializer.
 *
 * @param   {string} paymentKeyHash  28-byte hex payment credential
 * @returns {object}                 Mesh SDK PlutusData for Address
 */
export function encodePlutusAddress(paymentKeyHash) {
  return {
    alternative: 0,         // Address constructor index
    fields: [
      {
        alternative: 0,     // PubKeyCredential constructor index
        fields: [paymentKeyHash]  // plain hex string → CBOR ByteString
      },
      {
        alternative: 1,     // Nothing (no staking credential) constructor index
        fields: []
      }
    ]
  };
}

/**
 * Build the full Minswap V2 OrderDatum for a SWAP_EXACT_IN operation.
 *
 * The datum encodes:
 *   - sender / receiver as the same wallet address (refund goes back to user)
 *   - No receiver datum hash (plain wallet output)
 *   - SWAP_EXACT_IN step with output Asset and minimumReceive
 *   - Batcher fee: 2 ADA
 *   - Deposit ADA: 2 ADA
 *
 * @param   {string} paymentKeyHash    28-byte hex payment credential of the sender wallet
 * @param   {string} toPolicyId        Policy ID of the output token (empty string for ADA)
 * @param   {string} toTokenNameHex    Token name as hex (empty string for ADA)
 * @param   {number} minAmountOut      Minimum lovelace or token units to receive (slippage guard)
 * @returns {object}                   Mesh SDK PlutusData for the full OrderDatum
 */
export function buildMinswapV2Datum(paymentKeyHash, toPolicyId, toTokenNameHex, minAmountOut) {
  const addrData = encodePlutusAddress(paymentKeyHash);

  // SWAP_EXACT_IN step: constructor 0
  // Fields: output Asset, minimumReceive
  const step = {
    alternative: 0,         // SWAP_EXACT_IN
    fields: [
      {
        alternative: 0,     // Asset
        fields: [
          toPolicyId,       // plain hex string → CBOR ByteString (CurrencySymbol)
          toTokenNameHex    // plain hex string → CBOR ByteString (TokenName)
        ]
      },
      minAmountOut          // plain number → CBOR Integer (minimumReceive)
    ]
  };

  return {
    alternative: 0,                          // OrderDatum constructor index
    fields: [
      addrData,                              // sender   (canceller address)
      addrData,                              // receiver (destination after swap)
      { alternative: 1, fields: [] },        // receiverDatumHash: Nothing
      step,                                  // step: SWAP_EXACT_IN
      BATCHER_FEE_LOVELACE,                  // batcherFee: 2 ADA (plain number → CBOR Integer)
      DEPOSIT_ADA_LOVELACE                   // depositADA: 2 ADA (plain number → CBOR Integer)
    ]
  };
}
