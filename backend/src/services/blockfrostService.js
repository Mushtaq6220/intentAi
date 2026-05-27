import { config } from "../config/env.js";

/**
 * Service to interface with Blockfrost endpoints for asset details
 */

/**
 * Resolves standard market price converters for demo
 * @param {string} asset - ADA, USDM, DJED
 * @returns {Promise<number>} Live/mock value in USD
 */
export const getAssetPrice = async (asset = "ADA") => {
  const symbol = asset.toUpperCase();
  
  // Return premium mock exchange feeds for the hackathon MVP
  const feeds = {
    ADA: 0.465,
    USDM: 1.00,
    DJED: 1.015,
    MIN: 0.032,
    iUSD: 0.998
  };

  return feeds[symbol] || 1.00;
};

/**
 * Checks if the Blockfrost network service is fully configured
 * @returns {boolean} config active
 */
export const isBlockfrostConfigured = () => {
  return !!config.blockfrostApiKey;
};
