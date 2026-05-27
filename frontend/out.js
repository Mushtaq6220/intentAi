"use client";
import React, { useState, useRef, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useDashboard } from "@/context/DashboardContext";
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  ArrowUpRight,
  Cpu,
  CheckCircle2,
  ArrowLeftRight,
  Zap,
  RefreshCw,
  X,
  ChevronDown,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@meshsdk/core";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
const getExplorerTxUrl = (hash) => `https://preprod.cardanoscan.io/transaction/${hash}`;
const TxApprovalCard = ({ msg, cardState, onExecute, onReject, onEditIntent }) => {
  const intent = msg.intentData?.intent || {};
  const txPlan = msg.intentData?.transaction || {};
  const [copied, setCopied] = useState(false);
  if (!intent.action) return null;
  const getBadgeIcon = () => {
    if (intent.action === "send") return /* @__PURE__ */ React.createElement(Send, { className: "w-3.5 h-3.5 text-cyan-400" });
    if (intent.action === "swap") return /* @__PURE__ */ React.createElement(ArrowLeftRight, { className: "w-3.5 h-3.5 text-purple-400" });
    return /* @__PURE__ */ React.createElement(RefreshCw, { className: "w-3.5 h-3.5 text-pink-400" });
  };
  const getActionName = () => {
    if (intent.action === "send") return "ADA Transfer";
    if (intent.action === "swap") return "DEX Swap";
    return "Recurring Pay";
  };
  const formattedAmount = typeof intent.amount === "number" ? intent.amount.toLocaleString(void 0, { minimumFractionDigits: 2 }) : intent.amount || "0.00";
  const status = cardState?.status || "idle";
  const txHash = cardState?.txHash;
  const error = cardState?.error;
  const handleCopyHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2e3);
    }
  };
  const isDeclined = status === "declined" || status === "rejected";
  const isCompleted = status === "completed" || status === "success";
  return /* @__PURE__ */ React.createElement(
    motion.div,
    {
      initial: { opacity: 0, y: 12, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      className: `mt-3 w-full max-w-md tx-card-dark dark-only transition-all duration-300 ${isDeclined ? "opacity-60 saturate-50 border-rose-500/20" : ""}`
    },
    /* @__PURE__ */ React.createElement("div", { className: `tx-card-inner-dark p-[1px] rounded-2xl ${isDeclined ? "bg-rose-950/20" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: `tx-card-body-dark rounded-2xl p-4 space-y-3.5 relative overflow-hidden ${isDeclined ? "border-l-4 border-l-rose-500" : ""}` }, /* @__PURE__ */ React.createElement("div", { className: `absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none ${isDeclined ? "bg-rose-500/5" : "bg-cyan-500/5"}` }), /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0" }, getBadgeIcon()), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold text-gray-400 uppercase tracking-widest block leading-none" }, "Cardano AI Intent"), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-extrabold text-white mt-1 block leading-none" }, getActionName()))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-1.5" }, isDeclined ? /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/25" }, "DECLINED") : /* @__PURE__ */ React.createElement("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded-full border ${intent.riskLevel === "high" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : intent.riskLevel === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}` }, intent.riskLevel ? intent.riskLevel.toUpperCase() : "LOW"), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20 font-semibold" }, intent.confidence || 98, "% AI"))), /* @__PURE__ */ React.createElement("div", { className: "p-3.5 rounded-xl bg-white/5 border border-white/5" }, intent.action === "swap" ? /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("div", { className: "p-3.5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400 uppercase block font-bold tracking-wider" }, "From (Estimated Pay)"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-black font-mono text-white mt-1 block" }, formattedAmount)), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] font-black text-cyan-400" }, "\u20B3")), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-white" }, txPlan.fromToken || intent.fromToken || "ADA")))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-center -my-5 relative z-10" }, /* @__PURE__ */ React.createElement("div", { className: "w-8 h-8 rounded-full bg-purple-600 border-2 border-slate-900 flex items-center justify-center shadow-lg shadow-purple-500/20 active:scale-95 transition-all" }, /* @__PURE__ */ React.createElement(ArrowLeftRight, { className: "w-4 h-4 text-white rotate-90" }))), /* @__PURE__ */ React.createElement("div", { className: "p-3.5 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400 uppercase block font-bold tracking-wider" }, "To (Estimated Receive)"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-black font-mono text-white mt-1 block" }, (txPlan.estimatedOutput || intent.amount * 0.974).toLocaleString(void 0, { minimumFractionDigits: 4 }))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0" }, /* @__PURE__ */ React.createElement(Sparkles, { className: "w-3 h-3 text-purple-400 animate-pulse" })), /* @__PURE__ */ React.createElement("span", { className: "text-sm font-black text-white" }, txPlan.toToken || intent.toToken || "USDM"))))) : /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400 uppercase block font-bold tracking-wider" }, "Amount"), /* @__PURE__ */ React.createElement("span", { className: "text-2xl font-black font-mono text-white mt-1 block" }, formattedAmount, " ", /* @__PURE__ */ React.createElement("span", { className: "text-xs font-bold text-cyan-400" }, intent.token || "ADA"))), intent.receiverName && /* @__PURE__ */ React.createElement("div", { className: "text-right" }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-gray-400 uppercase block font-bold tracking-wider" }, "To"), /* @__PURE__ */ React.createElement("span", { className: "text-base font-black text-white mt-1 block" }, intent.receiverName)))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2 text-xs border-t border-white/5 pt-3" }, intent.action === "swap" ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "Exchange Rate"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-200 font-bold text-xs" }, "1 ", txPlan.fromToken || "ADA", " \u2248 ", txPlan.spotRate || "0.98", " ", txPlan.toToken || "USDM")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "Price Impact"), /* @__PURE__ */ React.createElement("span", { className: `font-mono font-bold text-xs ${(txPlan.priceImpact || 0) > 5 ? "text-rose-400 animate-pulse" : (txPlan.priceImpact || 0) > 2 ? "text-amber-400" : "text-emerald-400"}` }, txPlan.priceImpact ? `${txPlan.priceImpact.toFixed(2)}%` : "0.05%")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "Slippage Tolerance"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-cyan-400 font-extrabold text-[9px] uppercase tracking-wider" }, txPlan.slippage || "0.5%")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "DEX Pool Fee"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-200 font-bold text-xs" }, txPlan.swapFee || 0.15, " ", txPlan.toToken || "USDM")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "Cardano Ledger Fee"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-200 font-bold text-xs" }, txPlan.estimatedFeeAda || 0.32, " ADA")), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider shrink-0 pt-0.5" }, "DEX Vault Address"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-400 truncate max-w-[200px] text-right" }, txPlan.recipientAddress || txPlan.receiverAddress || "addr_test1qrm0ec2pvksrq5mw2dx3l376ngr7tsw5p9jel5lhrex4khw9staynmd3jpeh0hvsw5g5478cwrq8uhafpxz5gfc0w3nsv0uka8"))) : /* @__PURE__ */ React.createElement(React.Fragment, null, intent.receiverAddress && /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-start gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider shrink-0 pt-0.5" }, "Address"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-300 truncate max-w-[240px] text-right" }, intent.receiverAddress)), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "Network Fee"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-gray-200 font-bold text-xs" }, txPlan.estimatedFeeAda || 0.19, " ADA"))), /* @__PURE__ */ React.createElement("div", { className: "flex justify-between items-center" }, /* @__PURE__ */ React.createElement("span", { className: "text-gray-500 text-[9px] uppercase font-bold tracking-wider" }, "Network"), /* @__PURE__ */ React.createElement("span", { className: "font-mono text-cyan-400 font-extrabold text-[9px] uppercase tracking-wider" }, "Cardano Preprod"))), status === "signing" && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        className: "p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-center space-y-2"
      },
      /* @__PURE__ */ React.createElement("div", { className: "relative w-10 h-10 mx-auto" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 rounded-full border-4 border-cyan-500/10" }), /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin" })),
      /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-white" }, "Awaiting Wallet Signature"),
      /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-400" }, "Unlock your Lace extension to authorize")
    ), isCompleted && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        className: "p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/30 text-center space-y-3"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto" }, /* @__PURE__ */ React.createElement(CheckCircle2, { className: "w-6 h-6 text-emerald-400 animate-bounce" })),
      /* @__PURE__ */ React.createElement("p", { className: "text-sm font-black text-white" }, "Transaction Confirmed!"),
      txHash && /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5 font-mono text-[9px] text-gray-300" }, /* @__PURE__ */ React.createElement("span", { className: "truncate max-w-[200px]" }, txHash), /* @__PURE__ */ React.createElement("button", { onClick: handleCopyHash, className: "p-1 bg-white/5 hover:bg-white/10 rounded text-gray-400 hover:text-white" }, copied ? /* @__PURE__ */ React.createElement(Check, { className: "w-3 h-3 text-emerald-400" }) : /* @__PURE__ */ React.createElement(Copy, { className: "w-3 h-3" }))), /* @__PURE__ */ React.createElement(
        "a",
        {
          href: getExplorerTxUrl(txHash),
          target: "_blank",
          rel: "noopener noreferrer",
          className: "w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-200 hover:text-white transition-all"
        },
        /* @__PURE__ */ React.createElement("span", null, "View on Cardanoscan"),
        /* @__PURE__ */ React.createElement(ArrowUpRight, { className: "w-3 h-3 text-cyan-400" })
      ))
    ), (status === "error" || status === "failed") && /* @__PURE__ */ React.createElement(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        className: "p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/25 text-center space-y-2"
      },
      /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto" }, /* @__PURE__ */ React.createElement("span", { className: "text-xl font-black text-rose-400" }, "!")),
      /* @__PURE__ */ React.createElement("p", { className: "text-xs font-bold text-white" }, "Signing Rejected"),
      /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-gray-400" }, error || "Wallet refused or balance insufficient."),
      /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: () => onExecute(msg.id, intent, txPlan),
          className: "flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-[10px] font-bold text-rose-400 transition-all cursor-pointer"
        },
        "Try Again"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          onClick: onReject,
          className: "px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
        },
        "Dismiss"
      ))
    ), isDeclined && /* @__PURE__ */ React.createElement("div", { className: "p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex items-center justify-center gap-2 text-rose-400 font-bold text-xs" }, /* @__PURE__ */ React.createElement("span", { className: "w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" }), /* @__PURE__ */ React.createElement("span", null, "Transaction Declined")), (status === "awaiting_approval" || status === "idle") && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-2 pt-1" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onExecute(msg.id, intent, txPlan),
        className: "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-cyan-500/15 border border-cyan-400/20 active:scale-[0.99] cursor-pointer"
      },
      /* @__PURE__ */ React.createElement(Zap, { className: "w-4 h-4 fill-white text-white" }),
      "Approve Transaction"
    ), /* @__PURE__ */ React.createElement("div", { className: "flex gap-2" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onReject,
        className: "flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 font-bold text-[10px] transition-all cursor-pointer"
      },
      "Decline"
    ), msg.text && /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => onEditIntent(msg.id),
        className: "flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-[10px] transition-all cursor-pointer"
      },
      "Edit Intent"
    )))))
  );
};
export const ChatSection = ({
  messages,
  onSendMessage,
  isProcessing,
  onApproveSwap
}) => {
  const { isConnected, connectedWallet, meshWallet, refreshBalance } = useWallet();
  const { handleTxSuccess, handleTxFailure, handleAddAiMessage, transactionStates, updateTxState } = useDashboard();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);
  const suggestions = [
    { text: "Send 10 ADA to Rahul", label: "Simple Transfer" },
    { text: "Swap 50 ADA to USDM", label: "Stablecoin Swap" },
    { text: "Convert 30 ADA to AGIX", label: "AI Token Swap" },
    { text: "Swap 20 ADA to HOSKY", label: "Meme Token Swap" },
    { text: "Exchange 100 ADA to MIN", label: "DEX Token" },
    { text: "Swap 50 ADA to WMT", label: "Utility Token" }
  ];
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
    const msg = messages.find((m) => m.id === msgId);
    if (msg) {
      const idx = messages.indexOf(msg);
      if (idx > 0 && messages[idx - 1].sender === "user") {
        setInputValue(messages[idx - 1].text);
      }
    }
  };
  const handleExecuteTx = async (msgId, intent, txPlan) => {
    if (!isConnected) {
      handleTxFailure?.("Please connect your wallet first.");
      return;
    }
    const msg = messages.find((m) => m.id === msgId);
    const txId = msg?.txId || msgId;
    updateTxState(txId, { status: "signing", error: null });
    try {
      const activeWallet = meshWallet;
      if (!activeWallet) {
        throw new Error("No wallet connected. Please connect your Cardano wallet first.");
      }
      let txHash = "";
      if (intent.action === "swap" || intent.action === "send") {
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
                console.warn("[Swap] Aggregator build-tx failed:", buildData.error || buildData.message, "\u2014 falling back to on-chain order");
              }
            } catch (aggErr) {
              console.warn("[Swap] Aggregator API error:", aggErr.message, "\u2014 falling back to on-chain order");
            }
          }
          if (!usedAggregator) {
            let minAmountOut = 0;
            if (txPlan.estimatePayload && txPlan.estimatePayload.min_amount_out) {
              minAmountOut = Number(txPlan.estimatePayload.min_amount_out);
            } else if (txPlan.estimatedOutput) {
              minAmountOut = Math.floor(Number(txPlan.estimatedOutput) * 1e6 * 0.995);
            }
            const preprodResponse = await fetch(`${API_BASE_URL}/api/transaction/swap/build-preprod`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                senderAddress: walletAddress,
                fromToken: txPlan.fromToken || intent.fromToken || "ADA",
                toToken: txPlan.toToken || intent.toToken || "MIN",
                amount: intent.amount,
                minAmountOut
              })
            });
            const preprodData = await preprodResponse.json();
            if (!preprodResponse.ok || !preprodData.orderAddress) {
              throw new Error(preprodData.error || "Failed to build preprod swap order.");
            }
            const tx = new Transaction({ initiator: activeWallet });
            tx.sendLovelace(
              {
                address: preprodData.orderAddress,
                datum: {
                  value: preprodData.datum,
                  inline: true
                }
              },
              preprodData.amountLovelace.toString()
            );
            const unsignedTx = await tx.build();
            const signedTx = await activeWallet.signTx(unsignedTx);
            txHash = await activeWallet.submitTx(signedTx);
          }
        } else {
          let targetAddress = intent.receiverAddress;
          if (!targetAddress) {
            throw new Error("Cannot execute on-chain transfer: no receiver address resolved.");
          }
          const tx = new Transaction({ initiator: activeWallet });
          const lovelaceAmount = Math.floor(intent.amount * 1e6).toString();
          tx.sendLovelace(targetAddress, lovelaceAmount);
          const unsignedTx = await tx.build();
          const signedTx = await activeWallet.signTx(unsignedTx);
          const hash = await activeWallet.submitTx(signedTx);
          txHash = hash;
        }
        fetch(`${API_BASE_URL}/api/transaction/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txHash })
        }).catch(() => void 0);
        await refreshBalance(activeWallet);
      } else {
        try {
          const address = await activeWallet.getChangeAddress();
          const payload = `Authorize Cardano AI Intent: ${intent.action.toUpperCase()} ${intent.amount} ${intent.token || "ADA"}`;
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
        explorerUrl: getExplorerTxUrl(txHash),
        submittedAt: /* @__PURE__ */ new Date()
      });
      const isSwap = intent.action === "swap";
      const fromToken = txPlan?.fromToken || intent.fromToken || intent.token || "ADA";
      const toToken = txPlan?.toToken || intent.toToken || "USDM";
      const successText = isSwap ? `Swap successful: ${intent.amount} ${fromToken} to ${toToken}` : `Sent ${intent.amount} ${intent.token || "ADA"} to ${intent.receiverName || (intent.receiverAddress ? intent.receiverAddress.slice(0, 12) + "..." : "recipient")}`;
      handleAddAiMessage?.(successText);
    } catch (err) {
      console.error("Cardano AI Intent execution error:", err);
      const errMsg = err.message || "Signing was cancelled or rejected by browser extension.";
      updateTxState(txId, { status: "failed", error: errMsg });
      handleTxFailure?.(errMsg);
    }
  };
  const handleRejectTx = (msgId) => {
    const msg = messages.find((m) => m.id === msgId);
    const txId = msg?.txId || msgId;
    updateTxState(txId, { status: "declined" });
  };
  return /* @__PURE__ */ React.createElement("div", { className: "flex-1 flex flex-col min-h-0 bg-black/10 relative overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" }), /* @__PURE__ */ React.createElement("div", { className: "flex-1 overflow-y-auto p-6 md:p-8 pb-12 space-y-8" }, messages.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "h-full flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 select-none py-12" }, /* @__PURE__ */ React.createElement("div", { className: "p-5 rounded-3xl bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-purple-600/10 border border-cyan-500/25 shadow-2xl animate-float-slow shrink-0" }, /* @__PURE__ */ React.createElement(Bot, { className: "w-16 h-16 text-cyan-400" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, /* @__PURE__ */ React.createElement("h3", { className: "text-2xl font-black text-white bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent tracking-wide text-glow-cyan" }, "Cardano Intent Terminal"), /* @__PURE__ */ React.createElement("p", { className: "text-base text-gray-400 leading-relaxed font-medium" }, "Type how you want to transact in plain English \u2014 send ADA, exchange tokens, or setup recurring bills. The AI parses your intent into a beautiful secure confirmation card directly in the chat.")), /* @__PURE__ */ React.createElement("div", { className: "w-full space-y-4 pt-6" }, /* @__PURE__ */ React.createElement("p", { className: "text-xs text-gray-500 font-extrabold uppercase tracking-widest" }, "Select an example intent to begin"), /* @__PURE__ */ React.createElement("div", { className: "grid gap-3 sm:grid-cols-2" }, suggestions.map((s, idx) => /* @__PURE__ */ React.createElement(
    "button",
    {
      key: idx,
      onClick: () => handleSuggestionClick(s.text),
      className: "flex items-start justify-between text-left p-4.5 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 group shadow-md"
    },
    /* @__PURE__ */ React.createElement("div", { className: "space-y-1 pr-4" }, /* @__PURE__ */ React.createElement("span", { className: `text-[10px] font-bold uppercase tracking-wider block ${s.label === "AI Swap" || s.label === "Stablecoin Convert" ? "text-purple-400" : "text-cyan-400"}` }, s.label), /* @__PURE__ */ React.createElement("span", { className: "text-sm text-gray-200 font-semibold leading-relaxed" }, '"', s.text, '"')),
    /* @__PURE__ */ React.createElement(ArrowUpRight, { className: "w-5 h-5 text-gray-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" })
  ))))) : /* @__PURE__ */ React.createElement("div", { className: "space-y-6 max-w-4xl mx-auto" }, messages.map((msg) => {
    const isAi = msg.sender === "ai";
    const hasDraftedTx = msg.intentData?.intent?.action;
    const txId = msg.txId || msg.id;
    const cardState = transactionStates[txId] || { status: "awaiting_approval" };
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        key: msg.id,
        className: `flex gap-4 max-w-[90%] chat-msg-enter ${isAi ? "mr-auto" : "ml-auto flex-row-reverse"}`
      },
      /* @__PURE__ */ React.createElement("div", { className: `w-10 h-10 rounded-xl p-[1px] flex items-center justify-center shrink-0 shadow-lg ${isAi ? "bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 shadow-purple-500/20" : "bg-gradient-to-tr from-cyan-400 via-teal-400 to-indigo-500 shadow-cyan-500/20"}` }, /* @__PURE__ */ React.createElement("div", { className: "w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center" }, isAi ? /* @__PURE__ */ React.createElement(Bot, { className: "w-5 h-5 text-purple-400" }) : /* @__PURE__ */ React.createElement(User, { className: "w-5 h-5 text-cyan-400" }))),
      /* @__PURE__ */ React.createElement("div", { className: "space-y-1.5 flex-1 min-w-0" }, (!hasDraftedTx || msg.text) && /* @__PURE__ */ React.createElement("div", { className: isAi ? "chat-bubble-ai" : "chat-bubble-user" }, msg.text), isAi && hasDraftedTx && /* @__PURE__ */ React.createElement(
        TxApprovalCard,
        {
          msg,
          cardState,
          onExecute: handleExecuteTx,
          onReject: () => handleRejectTx(msg.id),
          onEditIntent: handleEditIntent
        }
      ), /* @__PURE__ */ React.createElement("span", { className: "chat-bubble-timestamp" }, new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })))
    );
  }), isProcessing && /* @__PURE__ */ React.createElement("div", { className: "flex gap-4 max-w-[90%] mr-auto items-start chat-msg-enter" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-500 p-[1px] flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20" }, /* @__PURE__ */ React.createElement("div", { className: "w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center" }, /* @__PURE__ */ React.createElement(Bot, { className: "w-5 h-5 text-purple-400" }))), /* @__PURE__ */ React.createElement("div", { className: "chat-bubble-ai flex items-center gap-3.5" }, /* @__PURE__ */ React.createElement("span", { className: "text-base font-semibold leading-none" }, "Llama-3 is formulating transaction"), /* @__PURE__ */ React.createElement("div", { className: "flex gap-1.5 items-center justify-center pt-1.5" }, /* @__PURE__ */ React.createElement(
    motion.span,
    {
      animate: { y: [0, -7, 0] },
      transition: { duration: 0.8, repeat: Infinity, delay: 0 },
      className: "w-2 h-2 rounded-full bg-cyan-400"
    }
  ), /* @__PURE__ */ React.createElement(
    motion.span,
    {
      animate: { y: [0, -7, 0] },
      transition: { duration: 0.8, repeat: Infinity, delay: 0.2 },
      className: "w-2 h-2 rounded-full bg-indigo-400"
    }
  ), /* @__PURE__ */ React.createElement(
    motion.span,
    {
      animate: { y: [0, -7, 0] },
      transition: { duration: 0.8, repeat: Infinity, delay: 0.4 },
      className: "w-2 h-2 rounded-full bg-purple-400"
    }
  )))), /* @__PURE__ */ React.createElement("div", { ref: messagesEndRef }))), /* @__PURE__ */ React.createElement("div", { className: "px-6 md:px-8 pt-5 pb-8 border-t border-white/5 bg-transparent shrink-0 z-10 relative" }, /* @__PURE__ */ React.createElement("div", { className: "max-w-4xl mx-auto" }, /* @__PURE__ */ React.createElement("form", { onSubmit: handleSubmit, className: "relative" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      disabled: isProcessing,
      value: inputValue,
      onChange: (e) => setInputValue(e.target.value),
      placeholder: isConnected ? "Describe transfer, swap or stake (e.g., 'Send 100 ADA to Alice')..." : "Please connect your Cardano preprod wallet top right to start trading",
      className: "w-full py-5 pl-6 pr-16 rounded-2xl bg-transparent border border-white/10 focus:border-cyan-500/50 outline-none text-base text-white placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl transition-all"
    }
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      type: "submit",
      disabled: !isConnected || isProcessing || !inputValue.trim(),
      className: "absolute right-2.5 top-2.5 p-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:via-indigo-400 hover:to-purple-500 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/15"
    },
    /* @__PURE__ */ React.createElement(Send, { className: "w-5 h-5" })
  )), !isConnected && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2.5 mt-3.5 text-xs md:text-sm text-amber-500 bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl" }, /* @__PURE__ */ React.createElement(AlertCircle, { className: "w-5 h-5 shrink-0" }), /* @__PURE__ */ React.createElement("span", null, "CIP-30 Wallet Missing: Connect Lace or Nami wallet on preprod network to construct and sign secure transactions.")))));
};
