/**
 * Validation Service — re-exports from the smart-contracts security layer.
 *
 * All validation logic is now maintained centrally in:
 *   smart-contracts/validators/intentValidator.js
 *
 * This file exists only for backward-compat imports within the backend.
 */
export {
  isLikelyCardanoAddress,
  adaToLovelace,
  validateIntentSafety
} from "../../../../smart-contracts/index.js";
