"use client";

import React, { useState } from "react";
import { 
  CheckCircle2, ExternalLink, History, Search, ArrowLeftRight, 
  Send, HelpCircle, Calendar, SlidersHorizontal, Copy, Check, 
  TrendingUp, Bot, Sparkles, Download, ArrowUpRight, DollarSign 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getExplorerTxUrl = (hash) => `https://preprod.cardanoscan.io/transaction/${hash}`;

export const TxHistory = ({ pastTransactions }) => {
  const [filter, setFilter] = useState("all"); // all | transfer | swap
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [copiedHashId, setCopiedHashId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleCopy = (id, text, type) => {
    navigator.clipboard.writeText(text);
    if (type === "address") {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopiedHashId(id);
      setTimeout(() => setCopiedHashId(null), 2000);
    }
  };

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      // Simulate file download by creating a CSV trigger
      const headers = "ID,Type,Amount,Asset,Recipient,Address,Hash,Date,Confidence,Risk\n";
      const rows = pastTransactions.map(tx => 
        `"${tx.id}","${tx.type}","${tx.amount}","${tx.assetName || "ADA"}","${tx.recipient || ""}","${tx.recipientAddress || ""}","${tx.txHash || ""}","${tx.date}","${tx.confidence}%","${tx.riskLevel || ""}"`
      ).join("\n");
      
      const blob = new Blob([headers + rows], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.setAttribute("href", url);
      a.setAttribute("download", `cardano_intent_history_${Date.now()}.csv`);
      a.click();
    }, 1200);
  };

  // Filter transactions
  const filteredTxs = pastTransactions.filter((tx) => {
    const matchesFilter = filter === "all" || tx.type === filter;
    const matchesSearch = 
      (tx.recipient || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.recipientAddress || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.txHash || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate statistics
  const totalADA = pastTransactions
    .filter(tx => (tx.assetName || "ADA").toUpperCase() === "ADA")
    .reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);

  const avgConfidence = pastTransactions.length > 0
    ? (pastTransactions.reduce((sum, tx) => sum + (tx.confidence || 95), 0) / pastTransactions.length).toFixed(1)
    : "100";

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
              <History className="w-5 h-5 text-white" />
            </div>
            Transaction History
          </h2>
          <p className="text-xs text-gray-400 mt-1 ml-13">
            Audit trail of natural language intents executed on Cardano Testnet
          </p>
        </div>

        {/* Action Button: Export */}
        <button
          onClick={handleExport}
          disabled={exporting || pastTransactions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/20 text-gray-300 hover:text-white font-semibold text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? (
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {exporting ? "Exporting CSV..." : "Export CSV"}
        </button>
      </div>

      {/* Stats Banner Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Stat 1 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-900/10 to-teal-900/5 border border-white/5 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Intents Volume</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-mono mt-2 block">
            {totalADA.toLocaleString(undefined, { minimumFractionDigits: 1 })} <span className="text-xs font-bold text-cyan-400">ADA</span>
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">Total transacted in Cardano Llama terminal</span>
        </div>

        {/* Stat 2 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-900/10 to-purple-900/5 border border-white/5 relative overflow-hidden group hover:border-indigo-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">Total Executed</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-mono mt-2 block">
            {pastTransactions.length} <span className="text-xs font-bold text-indigo-400">Tx</span>
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">Successfully verified intent drafts</span>
        </div>

        {/* Stat 3 */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-900/10 to-pink-900/5 border border-white/5 relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">Avg Parsing Match</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <span className="text-2xl font-black text-white font-mono mt-2 block">
            {avgConfidence}%
          </span>
          <span className="text-[9px] text-gray-500 mt-1 block">Llama-3 model parser precision rate</span>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipient, address, or transaction hash..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-xs placeholder-gray-500 transition-colors"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1 border border-white/5 self-start md:self-auto">
          {[
            { id: "all", label: "All Intents" },
            { id: "transfer", label: "Transfers" },
            { id: "swap", label: "Swaps" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                filter === item.id
                  ? "bg-gradient-to-r from-cyan-500/15 to-teal-500/10 border border-cyan-500/20 text-cyan-300 shadow-md"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Checklist / Table */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredTxs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-black/5"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                <History className="w-6 h-6 text-gray-500" />
              </div>
              <span className="text-xs text-gray-400 font-semibold block">No matching transactions found</span>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[280px] mx-auto">
                Transactions drafted using the AI Intent chat will be listed here after being executed.
              </p>
            </motion.div>
          ) : (
            filteredTxs.map((tx, idx) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="p-5 rounded-2xl bg-gradient-to-r from-white/2 via-white/1 to-transparent hover:from-cyan-950/10 hover:to-transparent border border-white/5 hover:border-cyan-500/25 hover:shadow-[0_8px_32px_rgba(13,148,136,0.04)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left block: Icon and meta */}
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105 duration-300 ${
                    tx.type === "swap"
                      ? "bg-purple-500/10 border-purple-500/20 text-purple-400"
                      : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                  }`}>
                    {tx.type === "swap" ? (
                      <ArrowLeftRight className="w-5.5 h-5.5" />
                    ) : (
                      <Send className="w-5.5 h-5.5" />
                    )}
                  </div>
                  
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-extrabold text-white text-sm capitalize tracking-wide">
                        {tx.type} Intent
                      </span>
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 rounded font-mono font-bold uppercase select-none tracking-wider">
                        Success
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 mt-1 flex items-center flex-wrap gap-1.5">
                      To: <span className="font-semibold text-gray-100">{tx.recipient || "DEX Protocol"}</span>
                      {tx.recipientAddress && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="text-[10px] text-gray-400 font-mono select-all">
                            {tx.recipientAddress.slice(0, 10)}...{tx.recipientAddress.slice(-8)}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.id, tx.recipientAddress, "address")}
                            className="text-gray-500 hover:text-cyan-400 transition-colors p-0.5 rounded hover:bg-white/5"
                            title="Copy address"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}
                    </p>

                    {tx.txHash && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <a
                          href={tx.explorerUrl || getExplorerTxUrl(tx.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold tracking-tight bg-cyan-950/20 border border-cyan-500/10 px-2 py-0.5 rounded hover:bg-cyan-950/40 transition-colors"
                        >
                          {tx.txHash.slice(0, 18)}...{tx.txHash.slice(-8)}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleCopy(tx.id, tx.txHash, "hash")}
                          className="text-gray-500 hover:text-cyan-400 transition-colors p-1 rounded hover:bg-white/5"
                          title="Copy TX Hash"
                        >
                          {copiedHashId === tx.id ? (
                            <Check className="w-3 h-3 text-emerald-400 animate-pulse" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right block: Amount and stats */}
                <div className="md:text-right flex flex-row md:flex-col justify-between md:justify-start items-center md:items-end gap-2 border-t border-white/5 pt-4 md:pt-0 md:border-0 shrink-0">
                  <div>
                    <span className="font-mono font-black text-white text-base">
                      {tx.amount} <span className="text-xs text-cyan-400 font-bold">{tx.assetName || "ADA"}</span>
                    </span>
                  </div>
                  
                  <div className="md:text-right">
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 justify-end font-semibold">
                      <span>Fee: {tx.fee || "0.17"} ADA</span>
                      <span className="text-gray-600">•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <span>{tx.date}</span>
                      </div>
                    </div>
                    
                    {tx.confidence !== null && tx.confidence !== undefined && (
                      <div className="text-[9px] text-gray-500 mt-1 font-mono flex items-center gap-1 justify-end">
                        <span>AI Match:</span>
                        <span className="text-purple-400 font-extrabold">{tx.confidence}%</span>
                        <span>|</span>
                        <span>risk:</span>
                        <span className="text-emerald-400 font-extrabold">{tx.riskLevel || "low"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
