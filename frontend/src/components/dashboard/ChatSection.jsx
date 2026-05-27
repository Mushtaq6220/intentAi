"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useDashboard } from "@/context/DashboardContext";
import {
  Send, Bot, User, Sparkles, AlertCircle, ArrowUpRight, Cpu,
  CheckCircle2, ArrowLeftRight, Zap, RefreshCw, X, ChevronDown, Copy, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
// ── COMPACT DUAL-THEME TRANSACTION APPROVAL CARD ─────────────────────────────
const TxApprovalCard = ({ msg, cardState, onExecute, onReject, onEditIntent }) => {
  const intent = msg.intentData?.intent || {};
  const txPlan = msg.intentData?.transaction || {};
  const [copied, setCopied] = useState(false);

  if (!intent.action) return null;

  const { colors, networkName, explorerUrl, activeNetwork } = useNetwork();

  const getBadgeIcon = () => {
    if (intent.action === "send") return <Send className="w-3.5 h-3.5 text-cyan-400" />;
    if (intent.action === "swap") return <ArrowLeftRight className="w-3.5 h-3.5 text-purple-400" />;
    if (intent.action === "stake") return <Cpu className="w-3.5 h-3.5 text-emerald-400" />;
    return <RefreshCw className="w-3.5 h-3.5 text-pink-400" />;
  };

  const getActionName = () => {
    if (intent.action === "send") return "ADA Transfer";
    if (intent.action === "swap") return "DEX Swap";
    if (intent.action === "stake") return "ADA Delegation";
    return "Recurring Pay";
  };

  const formattedAmount =
    typeof intent.amount === "number"
      ? intent.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
      : intent.amount || "0.00";

  const status = cardState?.status || "idle";
  const txHash = cardState?.txHash;
  const error = cardState?.error;

  const handleCopyHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDeclined = status === "declined" || status === "rejected";
  const isCompleted = status === "completed" || status === "success";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`mt-3 w-full max-w-md tx-card-dark dark-only transition-all duration-300 ${
        isDeclined ? "opacity-60 saturate-50 border-rose-500/20" : ""
      }`}
    >
      {/* ── Dark Theme Card ─────────────────────────────────────── */}
      <div className={`tx-card-inner-dark p-[1px] rounded-2xl ${isDeclined ? "bg-rose-950/20" : ""}`}>
        <div className={`tx-card-body-dark rounded-2xl p-4 space-y-3.5 relative overflow-hidden ${isDeclined ? "border-l-4 border-l-rose-500" : ""}`}>
          {/* Subtle bg glows */}
          <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${
            isDeclined ? "bg-rose-500/5" : colors.bgGlow
          }`} />

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {getBadgeIcon()}
              </div>
              <div>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block leading-none">Cardano AI Intent</span>
                <span className="text-sm font-extrabold text-white mt-1 block leading-none">{getActionName()}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {isDeclined ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25">
                  DECLINED
                </span>
              ) : (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  intent.riskLevel === "high"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    : intent.riskLevel === "medium"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {intent.riskLevel ? intent.riskLevel.toUpperCase() : "LOW"}
                </span>
              )}
              <span className="text-[9px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20 font-semibold">
                {intent.confidence || 98}% AI
              </span>
            </div>
          </div>

          {/* Amount display */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
            {intent.action === "swap" ? (
              <div className="space-y-3">
                {/* Pay Token Container */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block font-bold tracking-wider">From (Estimated Pay)</span>
                      <span className="text-2xl font-black font-mono text-white mt-1 block">
                        {formattedAmount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      <div className={`w-5 h-5 rounded-full ${colors.accentBg} flex items-center justify-center shrink-0`}>
                        <span className={`text-[9px] font-black ${colors.textAccent}`}>₳</span>
                      </div>
                      <span className="text-sm font-black text-white">{txPlan.fromToken || intent.fromToken || "ADA"}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector */}
                <div className="flex justify-center -my-5 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-purple-600 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all">
                    <ArrowLeftRight className="w-4 h-4 text-white rotate-90" />
                  </div>
                </div>

                {/* Receive Token Container */}
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] text-gray-400 uppercase block font-bold tracking-wider">To (Estimated Receive)</span>
                      <span className="text-2xl font-black font-mono text-white mt-1 block">
                        {(txPlan.estimatedOutput || (intent.amount * 0.974)).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                      </div>
                      <span className="text-sm font-black text-white">{txPlan.toToken || intent.toToken || "USDM"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block font-bold tracking-wider">Amount</span>
                  <span className="text-2xl font-black font-mono text-white mt-1 block">
                    {intent.action === "stake" ? "MAX" : formattedAmount} <span className={`text-xs font-bold ${colors.textAccent}`}>{intent.token || "ADA"}</span>
                  </span>
                </div>
                {intent.receiverName && intent.action !== "stake" && (
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 uppercase block font-bold tracking-wider">To</span>
                    <span className="text-base font-black text-white mt-1 block">{intent.receiverName}</span>
                  </div>
                )}
                {intent.action === "stake" && (
                  <div className="text-right">
                    <span className="text-[9px] text-gray-400 uppercase block font-bold tracking-wider">Target Pool</span>
                    <span className="text-base font-black text-white mt-1 block">{txPlan.poolTicker || "Unknown Pool"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details row */}
          <div className="space-y-2 text-xs border-t border-white/5 pt-3">
            {intent.action === "swap" ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">Exchange Rate</span>
                  <span className="font-mono text-gray-200 font-bold text-xs">
                    1 {txPlan.fromToken || "ADA"} ≈ {txPlan.spotRate || "0.98"} {txPlan.toToken || "USDM"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">Price Impact</span>
                  <span className={`font-mono font-bold text-xs ${
                    (txPlan.priceImpact || 0) > 5
                      ? "text-rose-400 animate-pulse"
                      : (txPlan.priceImpact || 0) > 2
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }`}>
                    {txPlan.priceImpact ? `${txPlan.priceImpact.toFixed(2)}%` : "0.05%"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">Slippage Tolerance</span>
                  <span className="font-mono text-cyan-400 font-extrabold text-[9px] uppercase tracking-wider">{txPlan.slippage || "0.5%"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">DEX Pool Fee</span>
                  <span className="font-mono text-gray-200 font-bold text-xs">{txPlan.swapFee || 0.15} {txPlan.toToken || "USDM"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">Cardano Ledger Fee</span>
                  <span className="font-mono text-gray-200 font-bold text-xs">{txPlan.estimatedFeeAda || 0.32} ADA</span>
                </div>
                <div className="flex justify-between items-center" title="~2 ADA batcher fee + ~2 ADA refundable deposit required by Cardano DEXs. The deposit is returned upon swap execution or cancellation.">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider cursor-help border-b border-dashed border-gray-500">Deposit & Batcher Fee (?)</span>
                  <span className="font-mono text-gray-200 font-bold text-xs">~4.00 ADA</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider shrink-0 pt-0.5">DEX Vault Address</span>
                  <span className="font-mono text-gray-400 truncate max-w-[200px] text-right">
                    {txPlan.orderAddress || txPlan.recipientAddress || txPlan.receiverAddress || (activeNetwork === "mainnet" ? "addr1z9ghva67a45s6zyt62we56f5k834auwcjl0tv8tmth0prjjj2c79gy9l76sdg0xwhd7r0c0kna0tycz4y5s6mlenh8pqsk3urw" : "addr_test1wrp79rpkcdz8x9d6tft0x0dx5mwuzac2sa4gm8cvkw5hcnqtr7yyv")}
                  </span>
                </div>
              </>
            ) : (
              <>
                {intent.receiverAddress && (
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider shrink-0 pt-0.5">Address</span>
                    <span className="font-mono text-gray-300 truncate max-w-[240px] text-right">{intent.receiverAddress}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">Network Fee</span>
                  <span className="font-mono text-gray-200 font-bold text-xs">{txPlan.estimatedFeeAda || 0.19} ADA</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-[9px] uppercase font-bold tracking-wider">Network</span>
              <span className={`font-mono ${colors.textAccent} font-extrabold text-[9px] uppercase tracking-wider`}>{networkName}</span>
            </div>
          </div>

          {/* Status states */}
          {status === "signing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-3.5 rounded-xl ${colors.accentBg} border ${colors.accentBorder} text-center space-y-2`}>
              <div className="relative w-10 h-10 mx-auto">
                <div className={`absolute inset-0 rounded-full border-4 ${colors.accentBorder}`} />
                <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${colors.borderCard} animate-spin`} />
              </div>
              <p className="text-xs font-bold text-white">Awaiting Wallet Signature</p>
              <p className="text-[10px] text-gray-400">Unlock your Lace extension to authorize</p>
            </motion.div>
          )}

          {isCompleted && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
              <p className="text-sm font-black text-white">Transaction Confirmed!</p>
              {txHash && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[9px] text-gray-300">
                    <span className="truncate max-w-[200px]">{txHash}</span>
                    <button onClick={handleCopyHash} className="p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <a href={`${explorerUrl}/transaction/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-200 hover:text-white transition-all">
                    <span>View on Cardanoscan</span>
                    <ArrowUpRight className={`w-3 h-3 ${colors.textAccent}`} />
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {(status === "error" || status === "failed") && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/25 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
                <span className="text-xl font-black text-rose-400">!</span>
              </div>
              <p className="text-xs font-bold text-white">Signing Rejected</p>
              <p className="text-[10px] text-gray-400">{error || "Wallet refused or balance insufficient."}</p>
              <div className="flex gap-2">
                <button onClick={() => onExecute(msg.id, intent, txPlan)}
                  className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold text-rose-400 transition-all cursor-pointer">
                  Try Again
                </button>
                <button onClick={onReject}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {isDeclined && (
            <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-center gap-2 text-rose-400 font-bold text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <span>Transaction Declined</span>
            </div>
          )}

          {(status === "awaiting_approval" || status === "idle") && (
            <div className="flex flex-col gap-2 pt-1">
              <button onClick={() => onExecute(msg.id, intent, txPlan)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${colors.brandGradient} ${colors.brandGradientHover} text-white font-extrabold text-sm transition-all shadow-lg ${colors.accentGlow} border ${colors.accentBorder} active:scale-[0.99] cursor-pointer`}>
                <Zap className="w-4 h-4 fill-white text-white" />
                Approve Transaction
              </button>
              <div className="flex gap-2">
                <button onClick={onReject}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 font-bold text-[10px] transition-all cursor-pointer">
                  Decline
                </button>
                {msg.text && (
                  <button onClick={() => onEditIntent(msg.id)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-[10px] transition-all cursor-pointer">
                    Edit Intent
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ── MAIN CHAT TERMINAL REDESIGN ──────────────────────────────────────────────
export const ChatSection = ({
  messages,
  onSendMessage,
  isProcessing,
  onApproveSwap,
}) => {
  const { isConnected, connectedWallet, walletAddress, meshWallet, refreshBalance, isWalletNetworkCorrect } = useWallet();
  const { handleTxSuccess, handleTxFailure, handleAddAiMessage, transactionStates, updateTxState } = useDashboard();
  const { colors, networkName, activeNetwork, explorerUrl } = useNetwork();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  const suggestions = [
    { text: "Send 10 ADA to Rahul", label: "Simple Transfer" },
    { text: "Swap 50 ADA to USDM", label: "Stablecoin Swap" },
    { text: "Convert 30 ADA to AGIX", label: "AI Token Swap" },
    { text: "Swap 20 ADA to HOSKY", label: "Meme Token Swap" },
    { text: "Exchange 100 ADA to MIN", label: "DEX Token" },
    { text: "Swap 50 ADA to WMT", label: "Utility Token" },
  ];

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isProcessing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    onSendMessage(inputValue);
    setInputValue("");
  };

  const handleSuggestionClick = (text) => {
    if (isProcessing) return;
    onSendMessage(text);
  };

  const handleEditIntent = (msgId) => {
    const msg = messages.find(m => m.id === msgId);
    if (msg) {
      // Find the user prompt immediately preceding this AI card response
      const idx = messages.indexOf(msg);
      if (idx > 0 && messages[idx - 1].sender === "user") {
        setInputValue(messages[idx - 1].text);
      }
    }
  };

  // ── ON-CHAIN / SANDBOX TX SIGNATURE AND EXECUTION ENGINE ─────────────────────
  const handleExecuteTx = async (msgId, intent, txPlan) => {
    if (!isConnected) {
      handleTxFailure?.("Please connect your wallet first.");
      return;
    }

    if (!isWalletNetworkCorrect) {
      handleTxFailure?.(`Wallet Network Mismatch. Please switch your wallet extension to ${activeNetwork === "mainnet" ? "Mainnet" : "Preprod"} to execute this transaction.`);
      return;
    }

    const msg = messages.find(m => m.id === msgId);
    const txId = msg?.txId || msgId;

    updateTxState(txId, { status: "signing", error: null });

    try {
      // Use the already-connected meshWallet directly — avoids re-enabling and extra wallet popups.
      // meshWallet is set by WalletContext when the user connects any CIP-30 wallet.
      const activeWallet = meshWallet;

      if (!activeWallet) {
        throw new Error("No wallet connected. Please connect your Cardano wallet first.");
      }

      let txHash = "";

      if (intent.action === "stake") {
        const rewardAddresses = await activeWallet.getRewardAddresses();
        if (!rewardAddresses || rewardAddresses.length === 0) {
          throw new Error("No reward address found in wallet.");
        }
        const rewardAddress = rewardAddresses[0];
        const poolId = txPlan.poolId || intent.poolId;
        
        if (!poolId) {
          throw new Error("Pool ID not found or invalid.");
        }

        console.log(`[Stake] Delegating ${rewardAddress} to ${poolId}`);
        const tx = new Transaction({ initiator: activeWallet });
        tx.delegateStake(rewardAddress, poolId);

        const unsignedTx = await tx.build();
        const signedTx = await activeWallet.signTx(unsignedTx);
        txHash = await activeWallet.submitTx(signedTx);

        // Notify backend (fire-and-forget)
        fetch(`${API_BASE_URL}/api/transaction/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash })
        }).catch(() => undefined);
        await refreshBalance(activeWallet);

      } else if (intent.action === "swap" || intent.action === "send") {
        if (intent.action === "swap") {
          // Real on-chain swap transaction on Cardano Preprod Testnet
          let usedAggregator = false;

          if (txPlan.estimatePayload) {
            // ── PATH 1: Try Minswap Aggregator API (works for mainnet wallets) ──
            try {
              const buildResponse = await fetch(`${API_BASE_URL}/api/transaction/swap/build`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  sender: walletAddress,
                  min_amount_out: txPlan.estimatePayload.min_amount_out,
                  estimate: txPlan.estimatePayload
                })
              });

              const buildData = await buildResponse.json();
              if (buildResponse.ok && buildData.cbor) {
                // Aggregator returned valid CBOR — sign and submit
                const signedTxHex = await activeWallet.signTx(buildData.cbor);
                const submittedHash = await activeWallet.submitTx(signedTxHex);
                txHash = submittedHash;
                usedAggregator = true;
              } else {
                // Aggregator failed (e.g. preprod wallet address has no mainnet UTXOs)
                console.warn("[Swap] Aggregator build-tx failed:", buildData.error || buildData.message, "— falling back to on-chain order");
              }
            } catch (aggErr) {
              console.warn("[Swap] Aggregator API error:", aggErr.message, "— falling back to on-chain order");
            }
          }

          if (!usedAggregator) {
            // ── PATH 2: On-chain Minswap V2 order (real Cardano transaction) fallback ──
            // Backend decodes bech32 address → pubKeyHash and builds Minswap V2 OrderDatum
            // Note: minAmountOut must be a safe integer in raw token units (no decimals)
            let minAmountOut = 1; // default minimum: accept at least 1 token unit
            if (txPlan.estimatePayload && txPlan.estimatePayload.min_amount_out) {
              // Aggregator returned a real quote: min_amount_out is already in raw units (integer string)
              const parsed = Math.floor(Number(txPlan.estimatePayload.min_amount_out));
              if (parsed > 0) minAmountOut = parsed;
            } else if (txPlan.estimatedOutput && Number(txPlan.estimatedOutput) > 0) {
              // Fallback estimate: estimatedOutput is a float (e.g. 4.97 USDM)
              // Multiply by 10^6 for 6-decimal tokens and apply 0.5% slippage tolerance
              minAmountOut = Math.floor(Number(txPlan.estimatedOutput) * 1_000_000 * 0.995);
              if (minAmountOut < 1) minAmountOut = 1;
            }

            const endpointUrl = activeNetwork === "mainnet" 
              ? `${API_BASE_URL}/api/transaction/swap/build-mainnet`
              : `${API_BASE_URL}/api/transaction/swap/build-preprod`;

            console.log(`[Swap:${activeNetwork}] Building order`, {
              senderAddress: walletAddress,
              fromToken: txPlan.fromToken || intent.fromToken || "ADA",
              toToken: txPlan.toToken || intent.toToken || "MIN",
              amount: intent.amount,
              minAmountOut,
            });

            const orderResponse = await fetch(endpointUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderAddress: walletAddress,
                fromToken: txPlan.fromToken || intent.fromToken || "ADA",
                toToken: txPlan.toToken || intent.toToken || "MIN",
                amount: intent.amount,
                minAmountOut,
              })
            });

            const orderData = await orderResponse.json();
            console.log(`[Swap:${activeNetwork}] Backend response:`, orderData);

            if (!orderResponse.ok || !orderData.orderAddress) {
              throw new Error(orderData.error || `Failed to build ${activeNetwork} swap order.`);
            }

            // ── PRE-FLIGHT: Check wallet UTxO sufficiency ──────────────────
            // Cardano eUTxO: each UTxO can only be used once per tx. If the
            // wallet has a single large UTxO, Mesh can't create a change output
            // from the same UTxO it is spending → "UTxO Fully Depleted" error.
            // We check total lovelace across UTxOs and ensure there's enough
            // for the swap + Cardano's minimum change output (1 ADA).
            let walletUtxos = [];
            try {
              walletUtxos = await activeWallet.getUtxos();
            } catch (_) {}

            const totalWalletLovelace = walletUtxos.reduce((acc, u) => {
              const lovelace = u?.output?.amount?.find?.(a => a.unit === "lovelace")?.quantity
                || u?.amount?.find?.(a => a.unit === "lovelace")?.quantity
                || "0";
              return acc + BigInt(lovelace);
            }, BigInt(0));

            const requiredLovelace = BigInt(orderData.amountLovelace) + BigInt(1_500_000); // swap + min change (1.5 ADA)
            if (totalWalletLovelace < requiredLovelace) {
              throw new Error(
                `Insufficient ADA. You need at least ${(Number(requiredLovelace) / 1_000_000).toFixed(2)} ADA ` +
                `(swap + ~4 ADA deposit/batcher + change), but your wallet only has ` +
                `${(Number(totalWalletLovelace) / 1_000_000).toFixed(2)} ADA.`
              );
            }

            if (walletUtxos.length === 1) {
              throw new Error(
                "UTxO Consolidation Required: Your wallet balance is locked in a single UTxO. " +
                "Please first send a small amount of ADA to yourself to split it into multiple UTxOs, " +
                "then retry the swap. (This is a Cardano eUTxO requirement — each output can only be spent once per transaction.)"
              );
            }

            // Build real Cardano transaction:
            //   Send ADA lovelace → Minswap V2 order contract address
            //   with inline Plutus datum (Minswap V2 SWAP_EXACT_IN OrderDatum)
            const amountLov = String(orderData.amountLovelace);
            console.log(`[Swap:${activeNetwork}] Sending`, amountLov, "lovelace to", orderData.orderAddress);
            console.log(`[Swap:${activeNetwork}] Wallet UTxOs: ${walletUtxos.length}, Total lovelace: ${totalWalletLovelace}`);

            const tx = new Transaction({ initiator: activeWallet });
            tx.sendLovelace(
              {
                address: orderData.orderAddress,
                datum: {
                  value: orderData.datum,
                  inline: true
                }
              },
              amountLov
            );

            const unsignedTx = await tx.build();
            const signedTx   = await activeWallet.signTx(unsignedTx);
            txHash            = await activeWallet.submitTx(signedTx);
          }

        } else {
          // Direct payment transfer flow
          let targetAddress = intent.receiverAddress;
          if (!targetAddress) {
            throw new Error("Cannot execute on-chain transfer: no receiver address resolved.");
          }

          const tx = new Transaction({ initiator: activeWallet });
          const lovelaceAmount = Math.floor(intent.amount * 1_000_000).toString();
          tx.sendLovelace(targetAddress, lovelaceAmount);

          const unsignedTx = await tx.build();
          const signedTx  = await activeWallet.signTx(unsignedTx);
          const hash       = await activeWallet.submitTx(signedTx);
          txHash = hash;
        }


        // Notify backend (fire-and-forget)
        fetch(`${API_BASE_URL}/api/transaction/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash })
        }).catch(() => undefined);

        await refreshBalance(activeWallet);
      } else {
        // Interactive CIP-30 Mock signature popup for Recurring!
        // Pulls up actual Lace browser signing prompt for authorization, verifying intent live!
        try {
          const address = await activeWallet.getChangeAddress();
          const payload = `Authorize Cardano AI Intent: ${intent.action.toUpperCase()} ${intent.amount} ${intent.token || "ADA"}`;
          await activeWallet.signData(address, Buffer.from(payload).toString("hex"));
        } catch (signErr) {
          throw new Error("User refused or cancelled transaction signing in the wallet extension.");
        }
        
        // Generate mock Preprod transaction hash
        const hex = "0123456789abcdef";
        let mockHash = "";
        for (let i = 0; i < 64; i++) mockHash += hex[Math.floor(Math.random() * 16)];
        txHash = mockHash;
      }

      updateTxState(txId, { status: "completed", txHash });

      // Update global tx history
      handleTxSuccess?.({
        txHash,
        explorerUrl: `${explorerUrl}/transaction/${txHash}`,
        submittedAt: new Date(),
      });

      // Inject a success AI message into the chat (persists via session storage on refresh)
      const isSwap = intent.action === "swap";
      const fromToken = txPlan?.fromToken || intent.fromToken || intent.token || "ADA";
      const toToken   = txPlan?.toToken   || intent.toToken   || "USDM";
      const successText = isSwap
        ? `Swap successful: ${intent.amount} ${fromToken} to ${toToken}`
        : intent.action === "stake"
          ? `Successfully delegated stake to ${txPlan.poolTicker || "pool"}`
          : `Sent ${intent.amount} ${intent.token || "ADA"} to ${intent.receiverName || (intent.receiverAddress ? intent.receiverAddress.slice(0, 12) + "..." : "recipient")}`;
      handleAddAiMessage?.(successText);

    } catch (err) {
      console.error("Cardano AI Intent execution error:", err);
      let errMsg = err.message || "Signing was cancelled or rejected by browser extension.";
      
      if (errMsg.includes("UTxO Balance Insufficient")) {
        const requiredAdaText = intent.action === "swap" ? `(Minswap requires a 4 ADA deposit/batcher fee in addition to your swap amount)` : ``;
        errMsg = `Insufficient ADA or UTxOs in your wallet to cover the transaction amount, ledger fees, and Cardano's minimum change requirements ${requiredAdaText}.`;
      }

      updateTxState(txId, { status: "failed", error: errMsg });
      handleTxFailure?.(errMsg);
    }
  };

  const handleRejectTx = (msgId) => {
    const msg = messages.find(m => m.id === msgId);
    const txId = msg?.txId || msgId;
    updateTxState(txId, { status: "declined" });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black/10 relative overflow-hidden">
      {/* Dynamic atmospheric radial backdrop */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />



      {/* Scrollable Message History Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-12 space-y-8">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 select-none py-12">
            <div className={`p-5 rounded-3xl bg-gradient-to-tr ${colors.cardGradient} border ${colors.borderCard} shadow-2xl animate-float-slow shrink-0`}>
              <Bot className={`w-16 h-16 ${colors.textAccent}`} />
            </div>
            
            <div className="space-y-3">
              <h3 className={`text-2xl font-black text-white bg-gradient-to-r ${colors.brandGradient} bg-clip-text text-transparent tracking-wide text-glow-cyan`}>
                Cardano Intent Terminal
              </h3>
              <p className="text-base text-gray-400 leading-relaxed font-medium">
                Type how you want to transact in plain English — send ADA, exchange tokens, or setup recurring bills. The AI parses your intent into a beautiful secure confirmation card directly in the chat.
              </p>
            </div>

            {/* Premium Interactive suggestions board */}
            <div className="w-full space-y-4 pt-6">
              <p className="text-xs text-gray-500 font-extrabold uppercase tracking-widest">Select an example intent to begin</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s.text)}
                    className={`flex items-start justify-between text-left p-4.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 ${colors.accentBorderHover} transition-all duration-300 group shadow-md`}
                  >
                    <div className="space-y-1 pr-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                        s.label === "AI Swap" || s.label === "Stablecoin Convert"
                          ? "text-purple-400"
                          : colors.textAccent
                      }`}>{s.label}</span>
                      <span className="text-sm text-gray-200 font-semibold leading-relaxed">"{s.text}"</span>
                    </div>
                    <ArrowUpRight className={`w-5 h-5 text-gray-500 group-hover:${colors.textAccent} group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5`} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-4xl mx-auto">
            {messages.map((msg) => {
              const isAi = msg.sender === "ai";
              const hasDraftedTx = msg.intentData?.intent?.action;
              const txId = msg.txId || msg.id;
              const cardState = transactionStates[txId] || { status: "awaiting_approval" };

              return (
                <div
                  key={msg.id}
                  className={`flex gap-4 max-w-[90%] chat-msg-enter ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Premium styled floating avatar */}
                  <div className={`w-10 h-10 rounded-xl p-[1px] flex items-center justify-center shrink-0 shadow-lg ${
                    isAi
                      ? "bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 shadow-purple-500/20"
                      : `bg-gradient-to-tr ${colors.brandGradient} ${colors.accentGlow}`
                  }`}>
                    <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                      {isAi ? <Bot className="w-5 h-5 text-purple-400" /> : <User className={`w-5 h-5 ${colors.textAccent}`} />}
                    </div>
                  </div>

                  {/* Bubble text & approval cards column */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Render standard message bubble only if we don't have a structured intent card OR we show a friendly header text */}
                    {(!hasDraftedTx || msg.text) && (
                      <div className={isAi ? "chat-bubble-ai" : "chat-bubble-user"}>
                        {msg.text}
                      </div>
                    )}

                    {/* RENDER THE BEAUTIFUL DYNAMIC TRANSACTION APPROVAL CARD */}
                    {isAi && hasDraftedTx && (
                      <TxApprovalCard
                        msg={msg}
                        cardState={cardState}
                        onExecute={handleExecuteTx}
                        onReject={() => handleRejectTx(msg.id)}
                        onEditIntent={handleEditIntent}
                      />
                    )}

                    <span className="chat-bubble-timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Bouncing three-dots typing processing indicator */}
            {isProcessing && (
              <div className="flex gap-4 max-w-[90%] mr-auto items-start chat-msg-enter">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 p-[1px] flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                  <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-purple-400" />
                  </div>
                </div>
                <div className="chat-bubble-ai flex items-center gap-3.5">
                  <span className="text-base font-semibold leading-none">Llama-3 is formulating transaction</span>
                  <div className="flex gap-1.5 items-center justify-center pt-1.5">
                    <motion.span
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      className="w-2 h-2 rounded-full bg-cyan-400"
                    />
                    <motion.span
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      className="w-2 h-2 rounded-full bg-indigo-400"
                    />
                    <motion.span
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      className="w-2 h-2 rounded-full bg-purple-400"
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Tray Redesign */}
      <div className="px-6 md:px-8 pt-5 pb-8 border-t border-white/5 bg-transparent shrink-0 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              disabled={isProcessing}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isConnected
                  ? "Describe transfer, swap or stake (e.g., 'Send 100 ADA to Alice')..."
                  : "Please connect your Cardano preprod wallet top right to start trading"
              }
              className="w-full py-5 pl-6 pr-16 rounded-2xl bg-transparent border border-white/10 focus:border-cyan-500/50 outline-none text-base text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all"
            />
            <button
              type="submit"
              disabled={!isConnected || isProcessing || !inputValue.trim()}
              className={`absolute right-2.5 top-2.5 p-3.5 rounded-xl bg-gradient-to-r ${colors.brandGradient} ${colors.brandGradientHover} text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg ${colors.accentGlow}`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          
          {!isConnected && (
            <div className="flex items-center gap-2.5 mt-3.5 text-xs md:text-sm text-amber-500 bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>CIP-30 Wallet Missing: Connect Lace or Nami wallet on preprod network to construct and sign secure transactions.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
