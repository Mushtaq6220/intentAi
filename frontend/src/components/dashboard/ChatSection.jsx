"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useDashboard } from "@/context/DashboardContext";
import {
  Send, Bot, User, Sparkles, AlertCircle, ArrowUpRight, Cpu,
  CheckCircle2, ArrowLeftRight, Zap, RefreshCw, X, ChevronDown, Copy, Check,
  Clock, Shield, BarChart2, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ── COMPACT FUTURISTIC FINTECH TRANSACTION APPROVAL CARD ─────────────────────────────
const TxApprovalCard = ({ msg, cardState, onExecute, onReject, onEditIntent }) => {
  const intent = msg.intentData?.intent || {};
  const txPlan = msg.intentData?.transaction || {};
  const [copied, setCopied] = useState(false);

  if (!intent.action) return null;

  const { colors, networkName, explorerUrl, activeNetwork } = useNetwork();

  const getBadgeIcon = () => {
    if (intent.action === "send") return <Send className="w-4 h-4 text-cyan-400" />;
    if (intent.action === "swap") return <ArrowLeftRight className="w-4 h-4 text-purple-400" />;
    if (intent.action === "stake") return <Cpu className="w-4 h-4 text-emerald-400" />;
    return <RefreshCw className="w-4 h-4 text-pink-400" />;
  };

  const getActionName = () => {
    if (intent.action === "send") return "Cardano ADA Transfer";
    if (intent.action === "swap") return "Holographic Swap Protocol";
    if (intent.action === "stake") return "Validator Delegation";
    return "Recurring Auto-Payment";
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
  const isSigning = status === "signing";
  const isFailed = status === "error" || status === "failed";

  // Timeline Step calculation based on transaction state
  const getTimelineSteps = () => {
    const steps = [
      { id: 1, label: "Intent Parsed", desc: "Natural speech translated", state: "done" },
      { id: 2, label: "Kernel Prepared", desc: "eUTxO inputs mapped", state: "pending" },
      { id: 3, label: "Sign Transaction", desc: "Secure wallet authorization", state: "pending" },
      { id: 4, label: "Ledger Confirmed", desc: "Cardano block settled", state: "pending" }
    ];

    if (status === "idle" || status === "awaiting_approval") {
      steps[1].state = "active";
    } else if (isSigning) {
      steps[1].state = "done";
      steps[2].state = "active";
    } else if (isCompleted) {
      steps[1].state = "done";
      steps[2].state = "done";
      steps[3].state = "done";
    } else if (isFailed || isDeclined) {
      steps[1].state = "done";
      steps[2].state = "failed";
    }

    return steps;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`mt-4 w-full max-w-lg transition-all duration-350 ${
        isDeclined ? "opacity-60 saturate-50 border-rose-500/20" : ""
      }`}
    >
      <div className={`tx-card-inner-dark p-[1.5px] rounded-3xl ${isDeclined ? "bg-rose-950/20" : "shadow-[0_20px_50px_rgba(0,0,0,0.4)]"}`}>
        <div className={`tx-card-body-dark rounded-3xl p-5.5 space-y-4.5 relative overflow-hidden ${isDeclined ? "border-l-4 border-l-rose-500" : ""}`}>
          
          {/* Subtle Dynamic Ambient BG Glowing Orbs */}
          <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-[30px] pointer-events-none ${
            isDeclined ? "bg-rose-500/5" : colors.bgGlow
          }`} />
          <div className="absolute -bottom-12 -left-12 w-28 h-28 rounded-full bg-purple-500/5 blur-[35px] pointer-events-none" />

          {/* Header row */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-md">
                {getBadgeIcon()}
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest block leading-none">Financial OS Intent</span>
                <span className="text-sm font-extrabold text-white mt-1.5 block leading-none">{getActionName()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border ${
                intent.riskLevel === "high"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                  : intent.riskLevel === "medium"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              }`}>
                {intent.riskLevel ? intent.riskLevel.toUpperCase() : "LOW RISK"}
              </span>
              <span className="text-[9px] bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/20 font-bold uppercase tracking-wider">
                {intent.confidence || 98}% AI Conf.
              </span>
            </div>
          </div>

          {/* Core Transfer/Swap Info Box */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
            {intent.action === "swap" ? (
              <div className="space-y-4">
                {/* Pay Token Container */}
                <div className="p-3.5 rounded-xl bg-[#030308]/60 border border-white/5 relative overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-wider">Estimated Pay</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xl font-black font-mono text-white">
                      {formattedAmount}
                    </span>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      <div className={`w-4.5 h-4.5 rounded-full ${colors.accentBg} flex items-center justify-center shrink-0`}>
                        <span className={`text-[9px] font-black ${colors.textAccent}`}>₳</span>
                      </div>
                      <span className="text-xs font-black text-white">{txPlan.fromToken || intent.fromToken || "ADA"}</span>
                    </div>
                  </div>
                </div>

                {/* Arrow Connector with Orbit Glow */}
                <div className="flex justify-center -my-6 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-purple-600 border border-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30 active:scale-95 transition-all">
                    <ArrowLeftRight className="w-4 h-4 text-white rotate-90" />
                  </div>
                </div>

                {/* Receive Token Container */}
                <div className="p-3.5 rounded-xl bg-[#030308]/60 border border-white/5 relative overflow-hidden">
                  <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-wider">Estimated Receive</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xl font-black font-mono text-white">
                      {(txPlan.estimatedOutput || (intent.amount * 0.974)).toLocaleString(undefined, { minimumFractionDigits: 4 })}
                    </span>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 shrink-0">
                      <div className="w-4.5 h-4.5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                      </div>
                      <span className="text-xs font-black text-white">{txPlan.toToken || intent.toToken || "USDM"}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-wider">Execution Amount</span>
                  <span className="text-xl font-black font-mono text-white mt-1.5 block leading-none">
                    {intent.action === "stake" ? "MAX BALANCE" : formattedAmount} <span className={`text-xs font-bold ${colors.textAccent}`}>{intent.token || "ADA"}</span>
                  </span>
                </div>
                {intent.receiverName && intent.action !== "stake" && (
                  <div className="text-right">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-wider">Recipient Name</span>
                    <span className="text-sm font-bold text-white mt-1.5 block leading-none">{intent.receiverName}</span>
                  </div>
                )}
                {intent.action === "stake" && (
                  <div className="text-right">
                    <span className="text-[9px] text-gray-500 uppercase block font-bold tracking-wider">Target Pool Ticker</span>
                    <span className="text-sm font-extrabold text-white mt-1.5 block leading-none">{txPlan.poolTicker || "Unknown Pool"}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details Expandable Panel */}
          <div className="space-y-2.5 text-[11px] border-t border-white/5 pt-3.5 leading-relaxed">
            {intent.action === "swap" ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px]">Exchange Oracle Rate</span>
                  <span className="font-mono text-gray-200 font-bold">
                    1 {txPlan.fromToken || "ADA"} ≈ {txPlan.spotRate || "0.98"} {txPlan.toToken || "USDM"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px]">Price Slippage Impact</span>
                  <span className={`font-mono font-black ${
                    (txPlan.priceImpact || 0) > 5 ? "text-rose-400 animate-pulse" : "text-emerald-400"
                  }`}>
                    {txPlan.priceImpact ? `${txPlan.priceImpact.toFixed(2)}%` : "0.05%"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px]">DEX Pool Script Fee</span>
                  <span className="font-mono text-gray-200 font-bold">{txPlan.swapFee || 0.15} {txPlan.toToken || "USDM"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px]">Cardano Ledger Network Fee</span>
                  <span className="font-mono text-gray-200 font-bold">{txPlan.estimatedFeeAda || 0.32} ADA</span>
                </div>
                <div className="flex justify-between items-center" title="Includes refundable Ada deposits required for smart contract executions on-chain.">
                  <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px] cursor-help border-b border-dashed border-gray-500 pb-[1px]">Refundable DEX Contract Deposit (?)</span>
                  <span className="font-mono text-gray-200 font-bold">~4.00 ADA</span>
                </div>
              </>
            ) : (
              <>
                {intent.receiverAddress && (
                  <div className="flex justify-between items-start gap-3">
                    <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px] shrink-0 pt-0.5">Resolved Address</span>
                    <span className="font-mono text-gray-300 truncate max-w-[250px] text-right">{intent.receiverAddress}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px]">Cardano Network Ledger Fee</span>
                  <span className="font-mono text-gray-200 font-bold">{txPlan.estimatedFeeAda || 0.19} ADA</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500 uppercase font-bold tracking-widest text-[8px]">Execution Pipeline Network</span>
              <span className={`font-mono ${colors.textAccent} font-extrabold text-[10px]`}>{networkName}</span>
            </div>
          </div>

          {/* ── HIGH-FIDELITY PIPELINE TRANSITION TIMELINE ───────────────── */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-extrabold block">Ledger Pipeline Status</span>
            <div className="grid grid-cols-4 gap-2 text-center select-none">
              {getTimelineSteps().map((step) => {
                const isDone = step.state === "done";
                const isActive = step.state === "active";
                const isFail = step.state === "failed";
                return (
                  <div key={step.id} className="space-y-1">
                    <div className="flex items-center justify-center relative">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all duration-300 ${
                        isDone
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                          : isActive
                            ? "bg-cyan-500/10 border-cyan-400 text-cyan-300 animate-pulse"
                            : isFail
                              ? "bg-rose-500/10 border-rose-500 text-rose-400"
                              : "bg-white/5 border-white/10 text-gray-600"
                      }`}>
                        {isDone ? <Check className="w-3 h-3" /> : step.id}
                      </div>
                    </div>
                    <p className={`text-[9px] font-extrabold uppercase leading-none mt-1 ${
                      isDone ? "text-emerald-400" : isActive ? "text-cyan-400" : isFail ? "text-rose-400" : "text-gray-600"
                    }`}>{step.label}</p>
                    <p className="text-[8px] text-gray-600 leading-none hidden sm:block">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Signing state visual overlay */}
          {status === "signing" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className={`p-4.5 rounded-2xl ${colors.accentBg} border ${colors.accentBorder} text-center space-y-3`}>
              <div className="relative w-11 h-11 mx-auto flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-4 ${colors.accentBorder} opacity-40`} />
                <div className={`absolute inset-0 rounded-full border-4 border-t-transparent ${colors.borderCard} animate-spin`} />
                <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Awaiting Wallet Cryptographic Signature</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">Unlock your Lace/Eternl extension browser wallet to authorize and sign the Lovelace allocation.</p>
            </motion.div>
          )}

          {/* Success / Complete state animation */}
          {isCompleted && (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/25 text-center space-y-3.5">
              <div className="w-11 h-11 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-widest leading-none">On-Chain Transaction Confirmed!</p>
              {txHash && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[9px] text-gray-300">
                    <span className="truncate pr-4 select-all">{txHash}</span>
                    <button onClick={handleCopyHash} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <a href={`${explorerUrl}/transaction/${txHash}`} target="_blank" rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black text-gray-200 hover:text-white transition-all duration-300">
                    <span>TRACK ON CARDANOSCAN</span>
                    <ArrowUpRight className={`w-3.5 h-3.5 ${colors.textAccent}`} />
                  </a>
                </div>
              )}
            </motion.div>
          )}

          {/* Failed / Error signing state */}
          {isFailed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="p-4.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto shadow-md">
                <AlertCircle className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-wider">Cryptographic Signature Rejected</p>
              <p className="text-[10px] text-gray-400 leading-relaxed">{error || "The wallet browser extension refused the UTxO build or authorization."}</p>
              <div className="flex gap-2">
                <button onClick={() => onExecute(msg.id, intent, txPlan)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-black uppercase tracking-wider text-rose-400 transition-all cursor-pointer">
                  Retry Signature
                </button>
                <button onClick={onReject}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-all cursor-pointer">
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          {isDeclined && (
            <div className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-center justify-center gap-2.5 text-rose-400 font-extrabold text-[10px] uppercase tracking-widest shadow-inner">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Transact Intent Declined</span>
            </div>
          )}

          {/* Awaiting Approval State Buttons */}
          {(status === "awaiting_approval" || status === "idle") && (
            <div className="flex flex-col gap-2 pt-1.5 relative z-10">
              <button onClick={() => onExecute(msg.id, intent, txPlan)}
                className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r ${colors.brandGradient} ${colors.brandGradientHover} text-white font-extrabold text-xs transition-all shadow-lg ${colors.accentGlow} border border-cyan-400/10 active:scale-[0.99] cursor-pointer tracking-widest uppercase`}>
                <Zap className="w-4 h-4 fill-white text-white" />
                Authorize Ledger Signature
              </button>
              <div className="flex gap-2">
                <button onClick={onReject}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/10 text-gray-400 hover:text-red-400 font-black text-[10px] tracking-wider uppercase transition-all cursor-pointer">
                  Decline Intent
                </button>
                {msg.text && (
                  <button onClick={() => onEditIntent(msg.id)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white font-black text-[10px] tracking-wider uppercase transition-all cursor-pointer">
                    Edit Speech
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

// ── MAIN JARVIS TERMINAL REDESIGN ──────────────────────────────────────────────
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
    { text: "Send 10 ADA to Brother", label: "Direct Transfer", desc: "Compile Lovelace transfer" },
    { text: "Swap 50 ADA to USDM", label: "Stablecoin DEX Exchange", desc: "Build Minswap Datum order" },
    { text: "Convert 30 ADA to AGIX", label: "AI Token Swaps", desc: "Exchange with live aggregator" },
    { text: "Swap 20 ADA to HOSKY", label: "Cardano Meme Swaps", desc: "Low price impact dex pool" },
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

        // Notify backend
        fetch(`${API_BASE_URL}/api/transaction/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash })
        }).catch(() => undefined);
        await refreshBalance(activeWallet);

      } else if (intent.action === "swap" || intent.action === "send") {
        if (intent.action === "swap") {
          let usedAggregator = false;

          if (txPlan.estimatePayload) {
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
                const signedTxHex = await activeWallet.signTx(buildData.cbor);
                const submittedHash = await activeWallet.submitTx(signedTxHex);
                txHash = submittedHash;
                usedAggregator = true;
              } else {
                console.warn("[Swap] Aggregator build-tx failed:", buildData.error || buildData.message, "— falling back to on-chain order");
              }
            } catch (aggErr) {
              console.warn("[Swap] Aggregator API error:", aggErr.message, "— falling back to on-chain order");
            }
          }

          if (!usedAggregator) {
            let minAmountOut = 1;
            if (txPlan.estimatePayload && txPlan.estimatePayload.min_amount_out) {
              const parsed = Math.floor(Number(txPlan.estimatePayload.min_amount_out));
              if (parsed > 0) minAmountOut = parsed;
            } else if (txPlan.estimatedOutput && Number(txPlan.estimatedOutput) > 0) {
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

            const requiredLovelace = BigInt(orderData.amountLovelace) + BigInt(1_500_000); 
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
                "then retry the swap. (This is a Cardano eUTxO requirement.)"
              );
            }

            const amountLov = String(orderData.amountLovelace);
            console.log(`[Swap:${activeNetwork}] Sending`, amountLov, "lovelace to", orderData.orderAddress);

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

        // Notify backend
        fetch(`${API_BASE_URL}/api/transaction/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash })
        }).catch(() => undefined);

        await refreshBalance(activeWallet);
      } else {
        // Mock signatures popup
        try {
          const address = await activeWallet.getChangeAddress();
          const payload = `Authorize IntentAi Intent: ${intent.action.toUpperCase()} ${intent.amount} ${intent.token || "ADA"}`;
          await activeWallet.signData(address, Buffer.from(payload).toString("hex"));
        } catch (signErr) {
          throw new Error("User refused or cancelled transaction signing in the wallet extension.");
        }
        
        const hex = "0123456789abcdef";
        let mockHash = "";
        for (let i = 0; i < 64; i++) mockHash += hex[Math.floor(Math.random() * 16)];
        txHash = mockHash;
      }

      updateTxState(txId, { status: "completed", txHash });

      handleTxSuccess?.({
        txHash,
        explorerUrl: `${explorerUrl}/transaction/${txHash}`,
        submittedAt: new Date(),
      });

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
    <div className="flex-1 flex flex-col min-h-0 bg-transparent relative overflow-hidden">
      {/* Immersive Mesh Backdrop Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Scrollable Message History Area */}
      <div className="flex-1 overflow-y-auto p-5 md:p-7 pb-12 space-y-7 scrollbar-thin">
        {messages.length === 0 ? (
          /* Jarvis Cockpit Empty State */
          <div className="min-h-full flex flex-col items-center justify-start md:justify-center text-center max-w-xl mx-auto space-y-5 md:space-y-8 select-none py-4 md:py-12">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl animate-float-slow shrink-0 border border-[var(--card-border)] bg-transparent">
              <img src="/logo-avatar.png" alt="IntentAi Logo" className="w-full h-full object-cover" />
            </div>
            
            <div className="space-y-2.5">
              <h3 className={`text-xl font-black text-white tracking-widest uppercase text-glow-cyan`}>
                IntentAi Financial Terminal
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Describe how you want to transact in plain speech (e.g., transfers, swaps, or stakes). The operating system interprets your words into safe ledger blueprints directly in your feed.
              </p>
            </div>

            {/* Suggestions Command Dock Grid */}
            <div className="w-full space-y-3.5 pt-4">
              <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Select command protocol to initialize</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(s.text)}
                    className="flex items-start justify-between text-left p-4 rounded-2xl border border-white/5 bg-[#030308]/40 hover:bg-white/5 hover:border-cyan-500/20 transition-all duration-300 group shadow-md"
                  >
                    <div className="space-y-1 pr-4">
                      <span className="text-[9px] font-black uppercase tracking-wider block text-cyan-400">{s.label}</span>
                      <span className="text-xs text-gray-200 font-semibold leading-tight">"{s.text}"</span>
                      <span className="text-[9px] text-gray-500 block font-mono">{s.desc}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
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
                  className={`flex gap-3 max-w-[95%] chat-msg-enter ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                >
                  {/* Glowing Custom Avatars */}
                  <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-md">
                    {isAi ? (
                      <img src="/logo-avatar.png" alt="IntentAi Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full p-[1px] bg-gradient-to-tr ${colors.brandGradient} rounded-xl`}>
                        <div className="w-full h-full rounded-[9px] bg-[var(--background)] flex items-center justify-center">
                          <User className={`w-4.5 h-4.5 ${colors.textAccent}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bubble text & transaction timeline panel */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {(!hasDraftedTx || msg.text) && (
                      <div className={isAi ? "chat-bubble-ai shadow-lg" : "chat-bubble-user shadow-lg"}>
                        {msg.text}
                      </div>
                    )}

                    {/* DYNAMIC TRANSACTION CARD PREVIEW */}
                    {isAi && hasDraftedTx && (
                      <TxApprovalCard
                        msg={msg}
                        cardState={cardState}
                        onExecute={handleExecuteTx}
                        onReject={() => handleRejectTx(msg.id)}
                        onEditIntent={handleEditIntent}
                      />
                    )}

                    <span className="chat-bubble-timestamp px-1.5">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Bouncing three-dots typing/formulaic processing indicator */}
            {isProcessing && (
              <div className="flex gap-3 max-w-[95%] mr-auto items-start chat-msg-enter">
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 shadow-md">
                  <img src="/logo-avatar.png" alt="IntentAi Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="chat-bubble-ai flex items-center gap-3.5 shadow-lg">
                  <span className="text-xs font-bold leading-none uppercase tracking-widest text-cyan-400 animate-pulse">Interpreting Language Protocol</span>
                  <div className="flex gap-1.5 items-center justify-center pt-1">
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    />
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                    />
                    <motion.span
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-purple-400"
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Tray Tray Overlays */}
      <div className="px-6 md:px-8 pt-4 pb-7 border-t border-[var(--card-border)] bg-gradient-to-b from-transparent to-[var(--background)] shrink-0 z-10 relative">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              disabled={isProcessing}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                isConnected
                  ? "Describe transfer, swap or delegation protocol (e.g. 'Stake ADA to CSP')..."
                  : "Please connect your preprod wallet in the top right to enable AI transacting..."
              }
              className="w-full py-4.5 pl-5 pr-14 rounded-2xl bg-[var(--input-bg)] border border-[var(--input-border)] focus:border-[var(--neon-cyan)]/40 outline-none text-sm text-[var(--foreground)] placeholder-[var(--text-faint)] disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl transition-all glass-panel"
            />
            <button
              type="submit"
              disabled={!isConnected || isProcessing || !inputValue.trim()}
              className={`absolute right-2 top-2 p-3.5 rounded-xl bg-gradient-to-r ${colors.brandGradient} ${colors.brandGradientHover} text-white transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-lg ${colors.accentGlow} cursor-pointer`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          
          {!isConnected && (
            <div className="flex items-center gap-2.5 mt-3 text-xs text-amber-500 bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl shadow-inner font-semibold leading-relaxed">
              <AlertCircle className="w-4.5 h-4.5 shrink-0" />
              <span>CIP-30 cryptographic wallet missing: Connect Lace, Eternl, or Nami to start compiling secure on-chain intents.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
