// ── Staking Pools Controller ─────────────────────────────────────────────────
// Serves Cardano staking pool data for both preprod and mainnet.
// Pool data is managed centrally in smart-contracts/validators/stakingPools.js

import {
  PREPROD_POOLS,
  MAINNET_POOLS,
  enrichPool
} from "../../../../smart-contracts/index.js";

/**
 * GET /api/staking/pools
 * Returns a list of staking pools for the current network.
 */
export const handleGetStakingPools = async (req, res) => {
  const network = req.query.network || req.headers["x-cardano-network"] || "preprod";
  const isMainnet = network === "mainnet";

  const pools = isMainnet ? MAINNET_POOLS : PREPROD_POOLS;

  // Add computed analytics fields from the smart-contracts enrichPool helper
  const enrichedPools = pools.map(enrichPool);

  return res.status(200).json({
    success: true,
    network,
    count: enrichedPools.length,
    pools: enrichedPools
  });
};

/**
 * GET /api/staking/pools/trending
 * Returns only trending / top pools (sorted by APY desc, top 3).
 */
export const handleGetTrendingPools = async (req, res) => {
  const network = req.query.network || req.headers["x-cardano-network"] || "preprod";
  const isMainnet = network === "mainnet";

  const pools = isMainnet ? MAINNET_POOLS : PREPROD_POOLS;
  const trending = [...pools]
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 3)
    .map(p => ({
      ticker:     p.ticker,
      name:       p.name,
      apy:        p.apy,
      poolId:     p.poolId,
      uptime:     p.uptime,
      saturation: p.saturation,
      delegates:  p.delegates
    }));

  return res.status(200).json({
    success: true,
    network,
    trending
  });
};
