// Token identifiers mapping for Preprod Testnet and Cardano Mainnet.
// These match the required formats for on-chain script routing and Minswap Aggregator APIs.
export const TOKEN_IDENTIFIERS = {
  mainnet: {
    ADA: "lovelace",
    LOVELACE: "lovelace",
    USDM: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d",
    MIN: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
    DJED: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61444a4544",
    SHEN: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd615348454e",
    WMT: "1d7f2c7a3d0257121212121212121212121212121212121212121212455448"
  },
  preprod: {
    ADA: "lovelace",
    LOVELACE: "lovelace",
    USDM: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d", // Mirrored USDM
    MIN: "e16c2dc8ae937e8d3790c7fd7168d7b994621ba14ca11415f39fed724d494e", // Preprod MIN (policy + hex)
    DJED: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61444a4544", // Mirrored DJED
    SHEN: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd615348454e", // Mirrored SHEN
    WMT: "1d7f2c7a3d0257121212121212121212121212121212121212121212455448"
  }
};

/**
 * Resolves standard token policy ID and Hex Name based on network.
 * @param {string} tokenSymbol - e.g. "USDM"
 * @param {string} network - "preprod" | "mainnet"
 * @returns {string} full asset identification string
 */
export const resolveTokenAssetId = (tokenSymbol, network = "preprod") => {
  const net = network === "mainnet" ? "mainnet" : "preprod";
  const symbol = String(tokenSymbol).toUpperCase();
  return TOKEN_IDENTIFIERS[net][symbol] || tokenSymbol.toLowerCase();
};

/**
 * Gets standard decimals for token symbol
 * @param {string} tokenSymbol 
 * @returns {number} decimal places
 */
export const getTokenDecimals = (tokenSymbol) => {
  const symbol = String(tokenSymbol).toUpperCase();
  if (symbol === "ADA" || symbol === "LOVELACE") return 6;
  if (symbol === "USDM" || symbol === "DJED" || symbol === "SHEN" || symbol === "MIN") return 6;
  return 6; // Standard fallback for Cardano tokens
};
