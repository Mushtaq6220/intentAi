/**
 * Simulated Liquidity Pool provider for Cardano native tokens.
 * Supports 20+ Cardano tokens with realistic simulated pool depths.
 * Falls back to a generic small-pool estimate for any unknown token.
 */

const LIQUIDITY_POOLS = {
  // Stablecoins
  "ADA-USDM":   { reserveA: 200000,  reserveB: 98000,       feeRate: 0.003 },
  "ADA-DJED":   { reserveA: 150000,  reserveB: 73500,       feeRate: 0.003 },
  "ADA-IUSD":   { reserveA: 100000,  reserveB: 49000,       feeRate: 0.003 },
  "ADA-USDA":   { reserveA: 80000,   reserveB: 39200,       feeRate: 0.003 },

  // DeFi / DEX tokens
  "ADA-MIN":    { reserveA: 300000,  reserveB: 4500000,     feeRate: 0.003 },
  "ADA-SHEN":   { reserveA: 120000,  reserveB: 432000,      feeRate: 0.003 },
  "ADA-LQ":     { reserveA: 90000,   reserveB: 135000,      feeRate: 0.003 },
  "ADA-COPI":   { reserveA: 75000,   reserveB: 225000,      feeRate: 0.003 },
  "ADA-SUNDAE": { reserveA: 110000,  reserveB: 550000,      feeRate: 0.003 },
  "ADA-AADA":   { reserveA: 80000,   reserveB: 240000,      feeRate: 0.003 },
  "ADA-VYFI":   { reserveA: 75000,   reserveB: 525000,      feeRate: 0.003 },
  "ADA-CERRA":  { reserveA: 50000,   reserveB: 250000,      feeRate: 0.003 },
  "ADA-NTX":    { reserveA: 60000,   reserveB: 300000,      feeRate: 0.003 },
  "ADA-INDY":   { reserveA: 85000,   reserveB: 170000,      feeRate: 0.003 },

  // Utility tokens
  "ADA-WMT":    { reserveA: 95000,   reserveB: 380000,      feeRate: 0.003 },
  "ADA-MILK":   { reserveA: 55000,   reserveB: 385000,      feeRate: 0.003 },
  "ADA-EMPOWA": { reserveA: 65000,   reserveB: 195000,      feeRate: 0.003 },
  "ADA-PAVIA":  { reserveA: 35000,   reserveB: 70000,       feeRate: 0.003 },
  "ADA-CLAY":   { reserveA: 40000,   reserveB: 160000,      feeRate: 0.003 },
  "ADA-BOOK":   { reserveA: 45000,   reserveB: 315000,      feeRate: 0.003 },

  // AI tokens
  "ADA-AGIX":   { reserveA: 130000,  reserveB: 910000,      feeRate: 0.003 },
  "ADA-IAG":    { reserveA: 70000,   reserveB: 490000,      feeRate: 0.003 },

  // Meme
  "ADA-HOSKY":  { reserveA: 200000,  reserveB: 20000000000, feeRate: 0.003 },
};

/**
 * Creates a generic fallback pool for unknown tokens.
 * Uses conservative small-pool estimates.
 */
const createGenericPool = () => ({
  reserveInput:  50000,
  reserveOutput: 150000,
  feeRate: 0.005,
  reversed: false,
  isGeneric: true,
});

/**
 * Retrieves simulated liquidity pool for a given swap pair.
 * Supports forward and reverse lookups, with fallback for any unknown token.
 */
export const getLiquidityPool = (tokenA = "ADA", tokenB = "USDM") => {
  const normA = String(tokenA).toUpperCase().trim();
  const normB = String(tokenB).toUpperCase().trim();

  const pairKey    = `${normA}-${normB}`;
  const reverseKey = `${normB}-${normA}`;

  if (LIQUIDITY_POOLS[pairKey]) {
    return {
      reserveInput:  LIQUIDITY_POOLS[pairKey].reserveA,
      reserveOutput: LIQUIDITY_POOLS[pairKey].reserveB,
      feeRate:       LIQUIDITY_POOLS[pairKey].feeRate,
      reversed:      false,
    };
  }

  if (LIQUIDITY_POOLS[reverseKey]) {
    return {
      reserveInput:  LIQUIDITY_POOLS[reverseKey].reserveB,
      reserveOutput: LIQUIDITY_POOLS[reverseKey].reserveA,
      feeRate:       LIQUIDITY_POOLS[reverseKey].feeRate,
      reversed:      true,
    };
  }

  // Generic fallback: accept any token pair not explicitly listed
  if (normA !== normB && normA.length > 0 && normB.length > 0) {
    return createGenericPool();
  }

  return null;
};

/**
 * Returns true for any valid (non-identical) token pair — generic fallback covers unknown pairs.
 */
export const isPairSupported = (tokenA, tokenB) => {
  const normA = String(tokenA || "").toUpperCase().trim();
  const normB = String(tokenB || "").toUpperCase().trim();
  return normA.length > 0 && normB.length > 0 && normA !== normB;
};

/**
 * Returns the list of all explicitly known token symbols
 */
export const getSupportedTokens = () => {
  const tokens = new Set(["ADA"]);
  Object.keys(LIQUIDITY_POOLS).forEach(pair => {
    pair.split("-").forEach(t => tokens.add(t));
  });
  return Array.from(tokens).sort();
};
