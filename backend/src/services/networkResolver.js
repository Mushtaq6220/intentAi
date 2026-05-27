import { config } from "../config/env.js";

/**
 * Helper to extract active Cardano network environment from an Express request object.
 * Checks request headers (X-Cardano-Network) first, then request body, then request query,
 * and falls back to server default environment settings.
 *
 * @param {object} req - Express request object
 * @returns {string} resolved network name: "preprod" | "mainnet"
 */
export const resolveNetwork = (req) => {
  if (!req) return config.cardanoNetwork || "preprod";

  const headerNet = req.headers && req.headers["x-cardano-network"];
  const bodyNet = req.body && req.body.network;
  const queryNet = req.query && req.query.network;

  const rawNet = headerNet || bodyNet || queryNet || config.cardanoNetwork || "preprod";
  const normalized = String(rawNet).trim().toLowerCase();

  return normalized === "mainnet" ? "mainnet" : "preprod";
};

/**
 * Resolves the appropriate Blockfrost API key depending on request network.
 * @param {string} network - resolved network ("preprod" | "mainnet")
 * @returns {string} blockfrostApiKey
 */
export const resolveBlockfrostApiKey = (network) => {
  const isMainnet = String(network).toLowerCase() === "mainnet";
  const resolvedKey = isMainnet
    ? (process.env.MAINNET_BLOCKFROST_API_KEY || config.mainnetBlockfrostApiKey || "")
    : (process.env.PREPROD_BLOCKFROST_API_KEY || config.preprodBlockfrostApiKey || "");

  // Fallback to basic blockfrostApiKey if dedicated ones are not filled
  return resolvedKey || config.blockfrostApiKey || "";
};

/**
 * Resolves the appropriate Blockfrost REST Endpoint URL based on requested network environment.
 * @param {string} network - resolved network
 * @returns {string} base blockfrost endpoint URL
 */
export const resolveBlockfrostBaseUrl = (network) => {
  const isMainnet = String(network).toLowerCase() === "mainnet";
  return isMainnet
    ? "https://cardano-mainnet.blockfrost.io/api/v0"
    : "https://cardano-preprod.blockfrost.io/api/v0";
};
