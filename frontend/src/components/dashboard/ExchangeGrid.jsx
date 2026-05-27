"use client";

import React, { useState } from "react";
import { ArrowDownUp, RefreshCw, TrendingUp, Sparkles, AlertTriangle, Play, HelpCircle, ShieldCheck, ShieldAlert, Layers, BellRing, ArrowUpRight, DollarSign, Wallet, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export const ExchangeGrid = ({
  onTriggerIntent,
  onExecuteSwapPreview,
}) => {
  // Token Swap states
  const [swapFrom, setSwapFrom] = useState("ADA");
  const [swapTo, setSwapTo] = useState("USDM");
  const [swapAmount, setSwapAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);

  // Conversion rates (simulated)
  const rates = {
    "ADA-USDM": 0.46,
    "USDM-ADA": 2.17,
    "ADA-DJED": 0.44,
    "DJED-ADA": 2.27,
  };

  const getSwapOutput = () => {
    if (!swapAmount || isNaN(Number(swapAmount))) return "0.00";
    const pair = `${swapFrom}-${swapTo}`;
    const reversePair = `${swapTo}-${swapFrom}`;
    if (rates[pair]) {
      return (Number(swapAmount) * rates[pair]).toFixed(2);
    } else if (rates[reversePair]) {
      return (Number(swapAmount) / rates[reversePair]).toFixed(2);
    }
    return "0.00";
  };

  const handleSwapTrigger = () => {
    if (!swapAmount || Number(swapAmount) <= 0) return;
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      // Trigger AI intent generation
      const intentStr = `Swap ${swapAmount} ${swapFrom} for ${swapTo}`;
      onTriggerIntent(intentStr);
      onExecuteSwapPreview(swapFrom, swapTo, Number(swapAmount));
    }, 1000);
  };

  // Mock Market Overview Tickers
  const marketTokens = [
    { name: "Cardano (ADA)", price: "$0.462", change: "+4.15%", up: true, sparkline: [12, 15, 14, 18, 17, 21, 23] },
    { name: "USDM Stable (USDM)", price: "$1.001", change: "+0.02%", up: true, sparkline: [20, 20, 21, 20, 20, 20, 20] },
    { name: "Djed Stable (DJED)", price: "$0.998", change: "-0.12%", up: false, sparkline: [18, 17, 16, 17, 18, 17, 16] },
  ];

  // Smart suggestions
  const suggestions = [
    {
      id: "sug-1",
      title: "Network Gas Savings Alert",
      text: "Cardano preprod gas fee is exceptionally low (0.165 ADA). Perfect window for scheduled swaps.",
      actionText: "Swap ADA for USDM",
      intent: "Swap 50 ADA for USDM when gas is low",
    },
    {
      id: "sug-2",
      title: "ADA Price Dip Detected",
      text: "ADA price is down 3.8% over the last 12h. Auto-trigger recommendations suggesting USDM swap bounds.",
      actionText: "Trigger limit buy",
      intent: "Buy 100 ADA using USDM",
    }
  ];

  // Scheduled / recurring rules
  const subscriptions = [
    { id: "sub-1", title: "Monthly Node Hosting Fee", amount: "15 ADA", to: "addr_test1qpvx...6kd79xp2wz", due: "1st of Month" },
    { id: "sub-2", title: "Weekly Portfolio Auto-DCA", amount: "30 ADA", to: "USDM Pool Contract", due: "Every Friday" },
  ];

  // Mock fraud addresses checks
  const [fraudSearchAddress, setFraudSearchAddress] = useState("");
  const [fraudCheckResult, setFraudCheckResult] = useState(null);
  const [isCheckingFraud, setIsCheckingFraud] = useState(false);

  const handleCheckFraud = (e) => {
    e.preventDefault();
    if (!fraudSearchAddress) return;
    setIsCheckingFraud(true);
    setTimeout(() => {
      setIsCheckingFraud(false);
      // Mock result: if address has "bad" in it, mark it dangerous, else safe
      if (fraudSearchAddress.toLowerCase().includes("bad") || fraudSearchAddress.toLowerCase().includes("suspicious")) {
        setFraudCheckResult({
          risk: "HIGH",
          color: "text-red-400 border-red-500/20 bg-red-500/5",
          score: 28,
          desc: "Identified in 3 reported phishing attempts. High correlation with block list metadata.",
        });
      } else {
        setFraudCheckResult({
          risk: "SAFE",
          color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
          score: 98,
          desc: "Clean history on preprod testnet indexes. Address correlates to verified smart pools.",
        });
      }
    }, 1200);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Portfolio & Market Grid Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Module 1: Portfolio Overview */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-64">
          <div className="absolute inset-0 bg-grid-bg opacity-10 pointer-events-none" />
          
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Portfolio Valuation</span>
              <h3 className="text-3xl font-black text-white font-mono mt-1">$4,852.20</h3>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +12.45%
                </span>
                <span className="text-[10px] text-gray-500 font-medium">(Last 30 Days)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="px-2.5 py-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px]">
                5,250.75 ADA
              </div>
              <div className="px-2.5 py-1 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono text-[10px]">
                2,437 USDM
              </div>
            </div>
          </div>

          {/* SVG Spline Graph representing ADA growth */}
          <div className="relative z-10 h-28 w-full mt-4 flex items-end">
            <svg viewBox="0 0 400 100" className="w-full h-full text-cyan-400 overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="20" x2="400" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              {/* Spline Path */}
              <path
                d="M 0 80 Q 50 60 100 70 T 200 40 T 300 50 T 400 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="animate-pulse-glow"
              />
              {/* Fill under line */}
              <path
                d="M 0 80 Q 50 60 100 70 T 200 40 T 300 50 T 400 20 L 400 100 L 0 100 Z"
                fill="url(#chart-grad)"
              />
              {/* Glowing Dots */}
              <circle cx="200" cy="40" r="3" fill="#00f2fe" />
              <circle cx="400" cy="20" r="3.5" fill="#00f2fe" className="animate-ping" />
            </svg>
          </div>
        </div>

        {/* Module 2: Token Swap Interface */}
        <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between h-64">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3.5 flex items-center gap-1.5">
              <ArrowDownUp className="w-3.5 h-3.5 text-cyan-400" />
              Instant Swap
            </h3>

            {/* Inputs tray */}
            <div className="space-y-3">
              {/* From input */}
              <div className="relative bg-black/40 rounded-xl border border-white/5 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-500 block">From</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={swapAmount}
                    onChange={(e) => setSwapAmount(e.target.value === "" ? "" : Number(e.target.value))}
                    className="bg-transparent text-sm font-bold text-white placeholder-gray-600 outline-none w-24 font-mono mt-0.5"
                  />
                </div>
                <select
                  value={swapFrom}
                  onChange={(e) => {
                    setSwapFrom(e.target.value);
                    if (e.target.value === swapTo) setSwapTo(swapFrom);
                  }}
                  className="bg-black/60 border border-white/10 text-xs rounded-lg px-2 py-1 text-white font-semibold outline-none"
                >
                  <option value="ADA">ADA</option>
                  <option value="USDM">USDM</option>
                  <option value="DJED">DJED</option>
                </select>
              </div>

              {/* To input */}
              <div className="relative bg-black/40 rounded-xl border border-white/5 p-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-gray-500 block">To (Estimated)</span>
                  <span className="text-sm font-bold text-gray-300 block font-mono mt-0.5">
                    {getSwapOutput()}
                  </span>
                </div>
                <select
                  value={swapTo}
                  onChange={(e) => {
                    setSwapTo(e.target.value);
                    if (e.target.value === swapFrom) setSwapFrom(swapTo);
                  }}
                  className="bg-black/60 border border-white/10 text-xs rounded-lg px-2 py-1 text-white font-semibold outline-none"
                >
                  <option value="USDM">USDM</option>
                  <option value="ADA">ADA</option>
                  <option value="DJED">DJED</option>
                </select>
              </div>
            </div>

            {/* Exchange Rate details */}
            <div className="flex items-center justify-between mt-2.5 text-[9px] text-gray-500 px-1 font-mono">
              <span>Rate</span>
              <span>1 {swapFrom} ≈ {(rates[`${swapFrom}-${swapTo}`] || 1 / rates[`${swapTo}-${swapFrom}`] || 1).toFixed(3)} {swapTo}</span>
            </div>
          </div>

          <button
            onClick={handleSwapTrigger}
            disabled={!swapAmount || isSwapping}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-cyan-500/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSwapping ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Preview Swap Intent"}
          </button>
        </div>
      </div>

      {/* Markets and Alerts Grid Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 3: Market Tickers */}
        <div className="p-5 rounded-2xl glass-panel space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cardano Testnet Assets</h3>
          <div className="space-y-3">
            {marketTokens.map((tok, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 rounded-xl">
                <div>
                  <span className="text-xs font-bold text-white block">{tok.name}</span>
                  <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">{tok.price}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Mini Sparkline SVG */}
                  <svg className="w-12 h-6 text-gray-500" viewBox="0 0 50 20">
                    <polyline
                      fill="none"
                      stroke={tok.up ? "#10b981" : "#ef4444"}
                      strokeWidth="1.5"
                      points={tok.sparkline.map((val, i) => `${(i * 50) / 6},${20 - val}`).join(" ")}
                    />
                  </svg>
                  
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    tok.up ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  }`}>
                    {tok.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Module 4: AI Smart Suggestions */}
        <div className="p-5 rounded-2xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI Suggestions
            </h3>

            <div className="space-y-3.5">
              {suggestions.map((sug) => (
                <div key={sug.id} className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl space-y-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span className="text-xs font-bold text-white">{sug.title}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-normal">{sug.text}</p>
                  
                  <button
                    onClick={() => onTriggerIntent(sug.intent)}
                    className="flex items-center gap-1 text-[10px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {sug.actionText} <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Module 5: Scheduled Payments / Subscriptions */}
        <div className="p-5 rounded-2xl glass-panel space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mb-3.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Recurring Payments
            </h3>

            <div className="space-y-3">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="p-3 bg-white/5 border border-white/5 rounded-xl space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-white truncate max-w-[140px]">{sub.title}</span>
                    <span className="text-xs font-mono font-bold text-cyan-400">{sub.amount}</span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-gray-500 mt-1">
                    <span>Due: {sub.due}</span>
                    <span className="truncate max-w-[90px] font-mono">{sub.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onTriggerIntent("Pay subscription monthly: 15 ADA to addr_test1")}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white transition-colors"
          >
            Create New Scheduler
          </button>
        </div>

      </div>

      {/* Fraud Detection Card Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Module 6: Fraud Detection Audit Card */}
        <div className="md:col-span-2 p-5 rounded-2xl glass-panel space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                AI Fraud & Anti-Phishing Guard
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">Audit Cardano preprod addresses for suspicious transaction velocities or reports</p>
            </div>
            
            <span className="text-[9px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
              v0.1 Guard Engine
            </span>
          </div>

          <form onSubmit={handleCheckFraud} className="flex gap-2">
            <input
              type="text"
              placeholder="Enter address prefix or label to audit (e.g. 'Brother' or type 'bad_addr' to test alert)..."
              value={fraudSearchAddress}
              onChange={(e) => setFraudSearchAddress(e.target.value)}
              className="flex-1 py-2 px-3 rounded-xl glass-input text-xs text-white"
            />
            <button
              type="submit"
              disabled={isCheckingFraud || !fraudSearchAddress.trim()}
              className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-bold text-xs transition-colors disabled:opacity-30"
            >
              {isCheckingFraud ? "Auditing..." : "Audit Address"}
            </button>
          </form>

          {/* Verification result display */}
          <AnimatePresence mode="wait">
            {fraudCheckResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${fraudCheckResult.color}`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                      {fraudCheckResult.risk === "HIGH" ? (
                        <>
                          <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" /> HIGH RISK ADDRESS
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> SAFE ADDRESS
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-xs leading-normal">{fraudCheckResult.desc}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold">Security Rating</span>
                  <span className={`text-2xl font-black font-mono ${
                    fraudCheckResult.risk === "HIGH" ? "text-red-400" : "text-emerald-400"
                  }`}>
                    {fraudCheckResult.score}/100
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Module 7: Quick Tutorial Card */}
        <div className="p-5 rounded-2xl glass-panel space-y-3.5 bg-gradient-to-br from-cyan-950/10 to-purple-950/10 border-cyan-500/15">
          <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            Sandbox Sandbox Instructions
          </h3>
          
          <ul className="space-y-2 text-[10px] text-gray-400 list-disc pl-4 leading-normal">
            <li>Type swap amounts in the swap calculator, then click "Preview Swap" to test intent conversion.</li>
            <li>Audit the fraud list by checking addresses containing <code className="text-cyan-300 font-mono">"bad"</code> to trigger security warnings.</li>
            <li>Click suggestions to auto-generate chats.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
