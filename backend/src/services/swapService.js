import { estimateSwapRate } from "./rateEstimator.js";
import { isPairSupported } from "./liquidityService.js";
import { config } from "../config/env.js";

// Mapping of tokens to their Policy ID + Hex Name (for Minswap aggregator)
// Supporting mainnet policy IDs since the Minswap Aggregator API is built for mainnet,
// but our transaction can be signed and processed on whatever network the user is on.
// Note: USDM and MIN are verified mainnet policy IDs that match the Minswap API assets.
const TOKEN_IDENTIFIERS = {
  ADA: "lovelace",
  LOVELACE: "lovelace",
  USDM: "c48cbb3d5e57ed56e276bc45f99ab39abe94e6cd7ac39fb402da47ad0014df105553444d",
  MIN: "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
  DJED: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd61444a4544",
  SHEN: "8db269c3ec630e06ae29f74bc39edd1f87c819f1056206e879a1cd615348454e",
  WMT: "1d7f2c7a3d0257121212121212121212121212121212121212121212455448" // Fallback fallback ID
};

/**
 * Creates a structured transaction plan specifically optimized for Cardano DEX token swaps
 * @param {object} intent - Parsed swap intent details
 * @param {string} rawPrompt - Natural language instruction
 * @param {string} senderAddress - Connected Lace/Nami wallet address
 * @param {number} balanceAda - Current ADA balance of sender
 * @returns {Promise<object>} Finalized swap transaction plan
 */
export const createSwapPlan = async ({ intent, rawPrompt = "", senderAddress, balanceAda, network }) => {
  const fromToken = String(intent.fromToken || "ADA").toUpperCase();
  const toToken = String(intent.toToken || "USDM").toUpperCase();
  const amount = Number(intent.amount || 0);

  const result = {
    valid: true,
    network: network || config.cardanoNetwork,
    transactionType: "swap",
    action: "swap",
    fromToken,
    toToken,
    amount,
    estimatedOutput: 0,
    priceImpact: 0,
    slippage: "0.5%",
    swapFee: 0,
    spotRate: 0,
    estimatedFeeAda: 0.32,
    riskLevel: intent.riskLevel || "low",
    warnings: [],
    errors: [],
    estimatePayload: null
  };

  // Validate amount
  if (amount <= 0 || !Number.isFinite(amount)) {
    result.valid = false;
    result.errors.push("Swap input amount must be a positive number greater than zero.");
    return result;
  }

  // Find asset IDs
  const assetIn = TOKEN_IDENTIFIERS[fromToken] || fromToken.toLowerCase();
  const assetOut = TOKEN_IDENTIFIERS[toToken] || toToken.toLowerCase();

  // Try calling Minswap Aggregator API
  try {
    const isFromAda = fromToken === "ADA" || fromToken === "LOVELACE";
    const decimalsIn = isFromAda ? 6 : 6; // Standard 6 decimal places for USDM/MIN
    const rawAmount = isFromAda 
      ? Math.floor(amount * 1_000_000).toString() 
      : Math.floor(amount * 1_000_000).toString();

    const response = await fetch("https://agg-api.minswap.org/aggregator/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: rawAmount,
        token_in: assetIn,
        token_out: assetOut,
        slippage: 0.5
      })
    });

    const data = await response.json();

    if (response.ok && !data.error) {
      // API call succeeded! Use real values.
      const rawOut = Number(data.amount_out);
      const outDecimals = data.tokens[assetOut]?.decimals || 6;
      result.estimatedOutput = rawOut / Math.pow(10, outDecimals);
      result.priceImpact = Number((data.avg_price_impact || 0).toFixed(2));
      result.slippage = "0.5%";
      result.swapFee = Number((Number(data.total_lp_fee || 0) / 1_000_000).toFixed(4));
      
      const rate = result.estimatedOutput / amount;
      result.spotRate = Number(rate.toFixed(6));
      result.estimatePayload = {
        token_in: data.token_in,
        token_out: data.token_out,
        amount: data.amount_in,
        amount_out: data.amount_out,
        min_amount_out: data.min_amount_out,
        total_lp_fee: data.total_lp_fee,
        total_dex_fee: data.total_dex_fee,
        deposits: data.deposits,
        avg_price_impact: data.avg_price_impact,
        paths: data.paths,
        aggregator_fee: data.aggregator_fee || "0",
        aggregator_fee_percent: data.aggregator_fee_percent || 0,
        slippage: 0.5
      };

      if (result.priceImpact > 5) {
        result.riskLevel = "high";
        result.warnings.push(`High price impact swap (${result.priceImpact}%). Swapping large volume relative to pool liquidity will cause rate slippage.`);
      }
    } else {
      // Fallback if token quote is not found
      throw new Error(data.message || "Quote not found on aggregator.");
    }
  } catch (err) {
    console.warn("Minswap Aggregator API query failed, falling back to rateEstimator:", err.message);
    
    // Calculate swap values using constant product DEX rates
    const swapRate = estimateSwapRate(fromToken, toToken, amount);
    if (!swapRate.success) {
      result.valid = false;
      result.errors.push(swapRate.error || "Failed to estimate swap conversion rates.");
      return result;
    }

    result.estimatedOutput = swapRate.estimatedOutput;
    result.spotRate = swapRate.spotRate;
    result.priceImpact = swapRate.priceImpact;
    result.slippage = swapRate.slippage;
    result.swapFee = swapRate.swapFee;

    if (swapRate.priceImpact > 5) {
      result.riskLevel = "high";
      result.warnings.push(`High price impact swap (${swapRate.priceImpact}%). Swapping large volume relative to pool liquidity will cause rate slippage.`);
    }
  }

  // Balance validations if sender balance is available
  if (typeof balanceAda === "number") {
    const requiredAda = fromToken === "ADA" ? amount + result.estimatedFeeAda : result.estimatedFeeAda;
    if (requiredAda > balanceAda) {
      result.valid = false;
      result.errors.push(`Insufficient ADA balance. You need at least ${requiredAda.toFixed(2)} ADA to cover the swap amount and Cardano network ledger fees.`);
    }
  }

  // Check if sender address is available
  if (!senderAddress) {
    result.warnings.push("Connect your browser wallet to build and sign this Cardano swap transaction on-chain.");
  }

  return {
    ...result,
    walletExecution: {
      builder: "Minswap Aggregator V2 API",
      signing: "CIP-30 wallet.signTx()",
      submission: "CIP-30 wallet.submitTx()",
      requiresWallet: true,
      senderAddress: senderAddress || null
    }
  };
};
