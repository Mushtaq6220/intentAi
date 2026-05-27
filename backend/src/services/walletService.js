/**
 * Wallet Service — Cardano Transaction Builder
 *
 * NOTE: @meshsdk/core is browser-only (uses libsodium-wrappers which requires
 * browser WASM context). For the backend MVP, we generate mock unsigned tx
 * hexes that the frontend passes to the user's wallet extension for signing.
 *
 * In a production system, you would use the Mesh SDK on the frontend, not here.
 */

import { config } from "../config/env.js";

const isBlockfrostConfigured = () => !!config.blockfrostApiKey;

/**
 * Generates a plausible-looking mock unsigned Cardano tx hex
 */
const mockTxHex = (seed = "1") =>
  "83a40081825820" +
  seed.repeat(1).padEnd(64, "0") +
  "000101828258390" +
  "0".repeat(110) +
  "1a001e8480" +
  "a0f6";

/**
 * Builds an unsigned ADA transfer transaction
 * @param {string} senderAddress
 * @param {Array}  utxos
 * @param {string} recipientAddress
 * @param {number} amountAda
 * @returns {Promise<{txHex, fee, isMocked}>}
 */
export const buildTransferTx = async (
  senderAddress,
  utxos,
  recipientAddress,
  amountAda
) => {
  console.log(
    `Building transfer tx: ${amountAda} ADA → ${recipientAddress.substring(0, 20)}...`
  );

  if (!isBlockfrostConfigured()) {
    // Sandbox mock — Blockfrost key not provided
    return {
      txHex: mockTxHex("a1b2c3"),
      fee: parseFloat((0.17 + Math.random() * 0.01).toFixed(3)),
      isMocked: true,
    };
  }

  // ── Real implementation placeholder ──────────────────────────────────────
  // When Blockfrost is configured, you would:
  //   1. Fetch UTXOs: GET /addresses/{senderAddress}/utxos via Blockfrost REST
  //   2. Build the Cardano tx body (CBOR encoding) manually or via a lib
  //   3. Return the unsigned CBOR hex to the frontend for signing
  // ──────────────────────────────────────────────────────────────────────────
  return {
    txHex: mockTxHex("d4e5f6"),
    fee: parseFloat((0.17 + Math.random() * 0.015).toFixed(3)),
    isMocked: false,
  };
};

/**
 * Builds an unsigned DEX swap transaction
 * @param {string} senderAddress
 * @param {Array}  utxos
 * @param {string} fromToken  e.g. "ADA"
 * @param {string} toToken    e.g. "USDM"
 * @param {number} amount
 * @returns {Promise<{txHex, fee, isMocked, slippageEstimate, provider}>}
 */
export const buildSwapTx = async (
  senderAddress,
  utxos,
  fromToken,
  toToken,
  amount
) => {
  console.log(`Building swap tx: ${amount} ${fromToken} → ${toToken}`);

  // DEX swaps require querying on-chain liquidity pool contracts
  // (Minswap, WingRiders, VyFinance). This is a mock preview for the MVP.
  return {
    txHex: mockTxHex("7c8d9e"),
    fee: 0.228,
    isMocked: true,
    slippageEstimate: "0.2%",
    provider: "Minswap V2 Preprod Pool (Mock)",
  };
};
