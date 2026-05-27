import { getLiquidityPool } from "./liquidityService.js";

/**
 * Calculates conversion output using Constant Product (x * y = k) DEX mechanics
 * @param {string} fromToken - Input token symbol (e.g. ADA)
 * @param {string} toToken - Output token symbol (e.g. USDM)
 * @param {number} inputAmount - Quantity of input token
 * @returns {object} Calculated swap rate details
 */
export const estimateSwapRate = (fromToken = "ADA", toToken = "USDM", inputAmount = 0) => {
  const pool = getLiquidityPool(fromToken, toToken);
  if (!pool || inputAmount <= 0) {
    return {
      success: false,
      error: `Unsupported pair or invalid input amount: ${fromToken} to ${toToken}`
    };
  }

  const x = pool.reserveInput;
  const y = pool.reserveOutput;
  const dx = Number(inputAmount);
  
  // Spot rate: base pool ratio
  const spotRate = y / x;

  // Constant product formula with pool fee: dy = (y * dx * (1 - fee)) / (x + dx * (1 - fee))
  const feeFactor = 1 - pool.feeRate;
  const dxWithFee = dx * feeFactor;
  const dy = (y * dxWithFee) / (x + dxWithFee);

  // Execution Rate: actual output divided by input
  const executionRate = dy / dx;

  // Price impact represents spot rate shift due to size: 1 - (executionRate / spotRate)
  const priceImpact = Math.max(0, (1 - (executionRate / spotRate)) * 100);

  // Dynamic slippage increases with price impact
  const baseSlippage = 0.5; // 0.5% base slippage
  const estimatedSlippage = (baseSlippage + priceImpact * 0.1).toFixed(2) + "%";

  const swapFee = dx * pool.feeRate;

  return {
    success: true,
    fromToken: fromToken.toUpperCase(),
    toToken: toToken.toUpperCase(),
    inputAmount: dx,
    estimatedOutput: Number(dy.toFixed(4)),
    spotRate: Number(spotRate.toFixed(6)),
    executionRate: Number(executionRate.toFixed(6)),
    priceImpact: Number(priceImpact.toFixed(2)),
    slippage: estimatedSlippage,
    swapFee: Number(swapFee.toFixed(4)),
    feeToken: fromToken.toUpperCase()
  };
};
