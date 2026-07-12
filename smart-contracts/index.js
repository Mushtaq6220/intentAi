/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  IntentAi — Smart Contracts Index
 *  smart-contracts/index.js
 * ══════════════════════════════════════════════════════════════════════════════
 *
 *  Single entry-point for all smart contract modules.
 *  Import from here instead of reaching into individual validator files.
 *
 *  Usage (backend services):
 *    import {
 *      buildMinswapV2Datum,
 *      PREPROD_TOKENS,
 *      MAINNET_TOKENS,
 *      resolvePoolIdByTicker,
 *      validateIntentSafety,
 *      adaToLovelace
 *    } from "../../smart-contracts/index.js";
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ── Minswap V2 Datum Builder ──────────────────────────────────────────────────
export {
  // Script addresses
  MINSWAP_V2_ORDER_ADDRESS_PREPROD,
  MINSWAP_V2_ORDER_ADDRESS_MAINNET,

  // Token registries
  PREPROD_TOKENS,
  MAINNET_TOKENS,

  // Fee / deposit constants
  BATCHER_FEE_LOVELACE,
  DEPOSIT_ADA_LOVELACE,

  // Utility functions
  extractPaymentCredential,
  encodePlutusAddress,
  buildMinswapV2Datum
} from "./validators/minswapV2Datum.js";

// ── Staking Pool Registry ─────────────────────────────────────────────────────
export {
  PREPROD_POOLS,
  MAINNET_POOLS,
  resolvePoolIdByTicker,
  getPoolByTicker,
  enrichPool
} from "./validators/stakingPools.js";

// ── Intent Safety Validator ───────────────────────────────────────────────────
export {
  isLikelyCardanoAddress,
  adaToLovelace,
  validateIntentSafety
} from "./validators/intentValidator.js";
