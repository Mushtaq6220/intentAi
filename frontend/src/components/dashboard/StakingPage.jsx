"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  TrendingUp, Shield, Clock, Award, ChevronRight, Zap, Lock,
  BarChart2, Layers, CheckCircle, AlertCircle, Loader2, X, Info, Sparkles, Activity
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";

const PREPROD_POOLS = [
  {
    id: "pool-1",
    name: "Cardano Secure Pool",
    ticker: "CSP",
    apy: 5.2,
    lockDuration: "None (Flexible)",
    lockDays: 0,
    minStake: 5,
    totalStaked: "42.8M",
    delegates: 1204,
    uptime: 99.8,
    riskLevel: "low",
    description: "Institutional-grade validator node with 99.8% uptime and transparent governance since 2021.",
    gradient: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    accent: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  },
  {
    id: "pool-2",
    name: "ADA Infinity Validator",
    ticker: "AINF",
    apy: 4.8,
    lockDuration: "30 Days Lock",
    lockDays: 30,
    minStake: 10,
    totalStaked: "31.5M",
    delegates: 876,
    uptime: 99.5,
    riskLevel: "low",
    description: "High-performance validator optimized for consistent epoch rewards and minimal saturation margins.",
    gradient: "from-purple-500/20 to-indigo-500/10",
    border: "border-purple-500/30",
    glow: "shadow-purple-500/10",
    accent: "text-purple-400",
    badge: "bg-purple-500/10 text-purple-300 border-purple-500/20",
  },
  {
    id: "pool-3",
    name: "Ocean Stake Labs",
    ticker: "OCEAN",
    apy: 6.1,
    lockDuration: "60 Days Lock",
    lockDays: 60,
    minStake: 50,
    totalStaked: "18.2M",
    delegates: 512,
    uptime: 98.9,
    riskLevel: "medium",
    description: "Premium yield pool. Higher APY with a 60-day lock period and performance-based reward multipliers.",
    gradient: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/30",
    glow: "shadow-emerald-500/10",
    accent: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  },
  {
    id: "pool-4",
    name: "Nebula Cardano Pool",
    ticker: "NEBLA",
    apy: 5.7,
    lockDuration: "14 Days Lock",
    lockDays: 14,
    minStake: 20,
    totalStaked: "25.6M",
    delegates: 743,
    uptime: 99.6,
    riskLevel: "low",
    description: "Community-governed node with transparent on-chain parameters and bi-weekly bonus distributions.",
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/30",
    glow: "shadow-amber-500/10",
    accent: "text-amber-400",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
];

const MAINNET_POOLS = [
  {
    id: "pool-mainnet-1",
    name: "SANO Staking",
    ticker: "SANO",
    poolId: "pool1wnnxuqkftm7z593s0tsnfxtq9069zup9slyndxryj4wun5g5xwe",
    apy: 3.5,
    lockDuration: "Flexible",
    lockDays: 0,
    minStake: 10,
    totalStaked: "6.2M",
    delegates: 812,
    uptime: 100,
    riskLevel: "low",
    description: "Reliable Mainnet pool supporting decentralization with zero hidden margins.",
    gradient: "from-rose-500/20 to-amber-500/10",
    border: "border-rose-500/30",
    glow: "shadow-rose-500/10",
    accent: "text-rose-400",
    badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
  },
  {
    id: "pool-mainnet-2",
    name: "WAVE Validator",
    ticker: "WAVE",
    poolId: "pool1pu5jlj4q9w9cjmllnmv4y0v6q96j22z3m33lq4c7v9j05t78044",
    apy: 3.8,
    lockDuration: "Flexible",
    lockDays: 0,
    minStake: 10,
    totalStaked: "15.4M",
    delegates: 2150,
    uptime: 99.9,
    riskLevel: "low",
    description: "High-performance mainnet pool driving community growth and stable block validations.",
    gradient: "from-orange-500/20 to-yellow-500/10",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/10",
    accent: "text-orange-400",
    badge: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  }
];

const USER_STAKES = [
  { pool: "Cardano Secure Pool", amount: 250, rewards: 3.24, apy: 5.2, status: "active", days: 18 },
];

export const StakingPage = () => {
  const { isConnected, adaBalance, meshWallet, isWalletNetworkCorrect } = useWallet();
  const { activeNetwork, colors, isMainnet, networkName } = useNetwork();
  const [selectedPool, setSelectedPool] = useState(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeState, setStakeState] = useState("idle"); // idle | preview | staking | success | error
  const [errorMsg, setErrorMsg] = useState("");
  const [activeView, setActiveView] = useState("pools"); // pools | portfolio

  const handleSelectPool = (pool) => {
    setSelectedPool(pool);
    setStakeAmount("");
    setStakeState("preview");
  };

  const handleStake = async () => {
    if (!isWalletNetworkCorrect) {
      setErrorMsg(`Wallet Network Mismatch. Switch extension to ${networkName}.`);
      return;
    }
    if (!stakeAmount || parseFloat(stakeAmount) < selectedPool.minStake) {
      setErrorMsg(`Minimum stake is ${selectedPool.minStake} ADA`);
      return;
    }
    setErrorMsg("");
    setStakeState("staking");

    try {
      if (isMainnet) {
        if (!meshWallet) throw new Error("Wallet not connected");
        
        const rewardAddresses = await meshWallet.getRewardAddresses();
        const rewardAddress = rewardAddresses[0];
        
        const tx = new Transaction({ initiator: meshWallet })
          .delegateStake(rewardAddress, selectedPool.poolId);
          
        const unsignedTx = await tx.build();
        const signedTx = await meshWallet.signTx(unsignedTx);
        const txHash = await meshWallet.submitTx(signedTx);
        
        console.log(`Mainnet delegation successful: ${txHash}`);
      } else {
        // Simulate preprod staking flow
        await new Promise((res) => setTimeout(res, 2200));
      }
      setStakeState("success");
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delegate stake");
      setStakeState("idle");
    }
  };

  const activePools = isMainnet ? MAINNET_POOLS : PREPROD_POOLS;

  const estimatedYearly = stakeAmount
    ? ((parseFloat(stakeAmount) || 0) * (selectedPool?.apy || 0)) / 100
    : 0;
  const estimatedMonthly = estimatedYearly / 12;

  return (
    <div className="flex-1 overflow-y-auto bg-transparent relative scrollbar-thin">
      {/* Dynamic Ambient Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Area Overhaul */}
      <div className="px-8 py-7 border-b border-white/5 bg-[#030308]/40 backdrop-blur-md relative z-10">
        <div className="flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${colors.brandGradient} p-[1px] flex items-center justify-center shadow-lg ${colors.accentGlow}`}>
              <div className="w-full h-full rounded-[11px] bg-[#030308] flex items-center justify-center">
                <TrendingUp className="w-5.5 h-5.5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-wider">Passive Yield Validator</h2>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Delegate ADA directly to secure block validation nodes on Cardano</p>
            </div>
          </div>

          {/* Premium Portfolio Summary Panel */}
          {isConnected && (
            <div className="flex items-center gap-5 p-3 px-5 rounded-2xl bg-[#030308]/60 border border-white/5 shadow-lg shadow-black/30">
              <div className="text-right">
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest leading-none">Wallet Balance</span>
                <span className="text-base font-black text-white font-mono mt-1.5 block leading-none">
                  {typeof adaBalance === "number" ? adaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}{" "}
                  <span className={`text-[10px] font-bold ${colors.textAccent}`}>ADA</span>
                </span>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="text-right">
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest leading-none">Currently Staked</span>
                <span className="text-base font-black text-emerald-400 font-mono mt-1.5 block leading-none">
                  250.00 <span className="text-[10px] font-bold text-emerald-300">ADA</span>
                </span>
              </div>
              <div className="h-6 w-[1px] bg-white/10" />
              <div className="text-right">
                <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest leading-none">Epoch Earnings</span>
                <span className="text-base font-black text-amber-400 font-mono mt-1.5 block leading-none">
                  +3.24 <span className="text-[10px] font-bold text-amber-300">ADA</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Tab Switcher */}
        <div className="flex items-center gap-1.5 mt-6 bg-[#030308]/60 border border-white/5 rounded-2xl p-1.5 w-fit shadow-md">
          {[
            { id: "pools", label: "Active Yield Pools" },
            { id: "portfolio", label: "My Staking Ledgers" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeView === tab.id
                  ? `bg-white/5 border border-white/10 ${colors.textAccent} shadow-md`
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content body */}
      <div className="p-6 md:p-8 relative z-10">
        {activeView === "pools" && (
          <>
            {/* Informational Spatial Hub Advisor Banner */}
            <div className="mb-8 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 flex items-start gap-4 shadow-sm backdrop-blur-md">
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider block">Non-Custodial Decentralized Staking</span>
                <p className="text-[11px] text-cyan-200 leading-relaxed font-medium">
                  Staked ADA never leaves your wallet extension. Staking processes generate on-chain delegation certificates representing block production validation weights. You retain full liquid asset control at all times, with rewards distributed automatically every 5-day epoch.
                </p>
              </div>
            </div>

            {/* Immersive Lido/Binance-Grade Pool Cards Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              {activePools.map((pool, idx) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`relative rounded-3xl bg-[#030308]/60 border ${pool.border} p-5.5 flex flex-col gap-4.5 hover:shadow-2xl ${pool.glow} hover:border-cyan-500/30 transition-all duration-350 group cursor-pointer overflow-hidden backdrop-blur-xl`}
                  onClick={() => handleSelectPool(pool)}
                >
                  {/* Subtle Background Glow Spheres */}
                  <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none group-hover:scale-110 transition-transform" />

                  {/* Header Row */}
                  <div className="flex items-start justify-between border-b border-white/5 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded-lg border ${pool.badge}`}>
                          {pool.ticker}
                        </span>
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-black uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3 h-3 text-emerald-400" />
                          LOW RISK
                        </span>
                      </div>
                      <h3 className="font-extrabold text-white text-base tracking-wide leading-none mt-1.5">{pool.name}</h3>
                    </div>
                    {/* APY Highlight */}
                    <div className="text-right leading-none">
                      <span className={`text-2xl font-black font-mono ${pool.accent} tracking-tight`}>{pool.apy}%</span>
                      <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest mt-1">APY Yield</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed font-medium">{pool.description}</p>

                  {/* Staking analytics details widgets */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 rounded-2xl bg-[#030308]/80 border border-white/5">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Lock className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-[10px] font-bold text-white block uppercase tracking-wider">{pool.lockDuration}</span>
                      <span className="text-[9px] text-gray-600 font-extrabold uppercase mt-0.5 block tracking-widest">Duration</span>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-[#030308]/80 border border-white/5">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart2 className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-[10px] font-black text-white block font-mono">{pool.totalStaked} ADA</span>
                      <span className="text-[9px] text-gray-600 font-extrabold uppercase mt-0.5 block tracking-widest">Staked Size</span>
                    </div>
                    <div className="text-center p-3 rounded-2xl bg-[#030308]/80 border border-white/5">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-3.5 h-3.5 text-gray-500" />
                      </div>
                      <span className="text-[10px] font-black text-white block font-mono">{pool.uptime}%</span>
                      <span className="text-[9px] text-gray-600 font-extrabold uppercase mt-0.5 block tracking-widest">Node Uptime</span>
                    </div>
                  </div>

                  {/* Upgraded Lido CTA Button */}
                  <button className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest bg-gradient-to-r ${pool.gradient} border ${pool.border} text-white group-hover:opacity-90 group-hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300`}>
                    <span>Stake Assets Now</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeView === "portfolio" && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-2 px-1">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-gray-400">Active Staking ledgers</h3>
            </div>

            {!isConnected ? (
              <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl bg-[#030308]/30">
                <Shield className="w-12 h-12 text-gray-700 mx-auto mb-3.5 animate-pulse" />
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Connect wallet extension to scan positions</p>
              </div>
            ) : (
              <>
                {/* Stats Widgets Panel */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Staked Sum", value: "250.00 ADA", sub: "1 Active Validator Pool", color: "text-cyan-400" },
                    { label: "Ledger Rewards Accum.", value: "+3.24 ADA", sub: "≈ $1.42 USD Spot Value", color: "text-emerald-400" },
                    { label: "Aggregated Yield APY", value: "5.20%", sub: "Annualized Yield Rate", color: "text-amber-400" },
                  ].map((card) => (
                    <div key={card.label} className="p-4 rounded-2xl bg-[#030308]/60 border border-white/5 text-center shadow-lg">
                      <span className={`text-base font-black font-mono block ${card.color}`}>{card.value}</span>
                      <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mt-2">{card.label}</span>
                      <span className="text-[8px] text-gray-600 block mt-0.5">{card.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Staked Positions cards list */}
                {USER_STAKES.map((stake, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5.5 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent border border-cyan-500/20 shadow-xl backdrop-blur-xl"
                  >
                    <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                      <div>
                        <span className="font-extrabold text-white text-sm tracking-wide">{stake.pool}</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Ledger Active · Epoch Day {stake.days % 5}/5</span>
                        </div>
                      </div>
                      <div className="text-right leading-none">
                        <span className="text-xl font-black text-white font-mono">{stake.apy}%</span>
                        <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest mt-1">AP Yield</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3.5 rounded-xl bg-[#030308]/85 border border-white/5">
                        <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Active Staked Sum</span>
                        <span className="text-sm font-black text-white font-mono mt-1 block">{stake.amount} ADA</span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[#030308]/85 border border-white/5">
                        <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Earned Block Rewards</span>
                        <span className="text-sm font-black text-emerald-400 font-mono mt-1 block">+{stake.rewards} ADA</span>
                      </div>
                    </div>

                    {/* Progress tracking meters */}
                    <div className="mb-1.5 flex justify-between text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                      <span>Epoch settlement progress</span>
                      <span>Day {stake.days % 5}/5</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 border border-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse-glow"
                        style={{ width: `${((stake.days % 5) / 5) * 100}%` }}
                      />
                    </div>

                    {/* Action controls */}
                    <div className="flex gap-2.5 mt-5">
                      <button className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all cursor-pointer">
                        Claim Rewards
                      </button>
                      <button className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all cursor-pointer">
                        Unstake Assets
                      </button>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Stake Modal Overhaul */}
      <AnimatePresence>
        {selectedPool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedPool(null); setStakeState("idle"); }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="relative w-full max-w-md bg-[#030308]/98 border border-white/10 rounded-3xl p-6.5 shadow-2xl overflow-hidden pointer-events-auto">
                {/* BG Glowing elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {stakeState !== "success" && (
                  <button
                    onClick={() => { setSelectedPool(null); setStakeState("idle"); }}
                    className="absolute top-4.5 right-4.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-gray-400 hover:text-white transition-colors z-10 cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                )}

                <div className="relative z-10">
                  {stakeState === "staking" ? (
                    <div className="text-center py-10 space-y-4">
                      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
                      <h4 className="text-base font-extrabold uppercase tracking-widest text-white">Delegation Certificate In Assembly</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Please approve the transaction preview inside your wallet browser extension. ADA balance will delegate securely to{" "}
                        <span className={`font-bold ${colors.textAccent}`}>{selectedPool.name}</span>.
                      </p>
                    </div>
                  ) : stakeState === "success" ? (
                    <div className="text-center py-8 space-y-5">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                        <CheckCircle className="w-7 h-7 text-emerald-400 animate-bounce" />
                      </div>
                      <h4 className="text-base font-black uppercase tracking-wider text-white">Delegation Finalized! 🎉</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Your <span className="text-white font-black">{stakeAmount} ADA</span> is now active on validator{" "}
                        <span className={`font-bold ${colors.textAccent}`}>{selectedPool.name}</span>. Epoch validation cycles start processing rewards in due time.
                      </p>
                      <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-emerald-300 text-center font-bold font-mono">
                        Estimated Epoch Reward: <span className="font-black">{(estimatedMonthly * 5 / 30).toFixed(4)} ADA</span>
                      </div>
                      <button
                        onClick={() => { setSelectedPool(null); setStakeState("idle"); setActiveView("portfolio"); }}
                        className={`w-full py-3 rounded-2xl bg-gradient-to-r ${colors.brandGradient} text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer`}
                      >
                        View Active Positions
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Pool Info Header */}
                      <div className="mb-6 border-b border-white/5 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-extrabold text-white text-base tracking-wide leading-none">{selectedPool.name}</h3>
                            <span className={`text-[10px] font-mono font-bold mt-1.5 block leading-none ${selectedPool.accent}`}>{selectedPool.ticker}</span>
                          </div>
                          <div className="text-right leading-none">
                            <span className={`text-2xl font-black font-mono ${selectedPool.accent}`}>{selectedPool.apy}%</span>
                            <span className="text-[9px] text-gray-500 block uppercase font-bold tracking-widest mt-1">APY Yield</span>
                          </div>
                        </div>
                      </div>

                      {/* Pool Stats grid */}
                      <div className="grid grid-cols-3 gap-2.5 mb-6">
                        {[
                          { label: "Duration", value: selectedPool.lockDuration, icon: <Lock className="w-3.5 h-3.5" /> },
                          { label: "Node Uptime", value: `${selectedPool.uptime}%`, icon: <Zap className="w-3.5 h-3.5" /> },
                          { label: "Min Staking", value: `${selectedPool.minStake} ADA`, icon: <Layers className="w-3.5 h-3.5" /> },
                        ].map((s) => (
                          <div key={s.label} className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                            <div className="flex items-center justify-center gap-1 text-gray-500 mb-1.5">{s.icon}</div>
                            <span className="text-[10px] font-bold text-white block uppercase tracking-wider leading-tight">{s.value}</span>
                            <span className="text-[9px] text-gray-600 block mt-0.5">{s.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Input fields */}
                      <div className="mb-5">
                        <label className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block mb-2 px-1">
                          Stake Amount (ADA)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={selectedPool.minStake}
                            value={stakeAmount}
                            onChange={(e) => { setStakeAmount(e.target.value); setErrorMsg(""); }}
                            placeholder={`Min. ${selectedPool.minStake} ADA`}
                            className="w-full py-3.5 px-4 pr-16 rounded-2xl bg-[#030308]/60 border border-white/5 focus:border-cyan-500/40 outline-none text-white font-mono text-sm placeholder-gray-600 transition-colors"
                          />
                          <button
                            onClick={() => adaBalance && setStakeAmount(Math.floor(adaBalance).toString())}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-cyan-400 px-2.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 transition-colors cursor-pointer"
                          >
                            MAX
                          </button>
                        </div>
                        {errorMsg && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {errorMsg}
                          </div>
                        )}
                      </div>

                      {/* Reward Projection */}
                      {stakeAmount && parseFloat(stakeAmount) >= selectedPool.minStake && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-5 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2"
                        >
                          <span className="text-[9px] text-emerald-400 font-extrabold uppercase tracking-widest block px-1">
                            Projection Estimator
                          </span>
                          <div className="flex justify-between text-xs leading-relaxed">
                            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Monthly Accum.</span>
                            <span className="font-black text-white font-mono">+{estimatedMonthly.toFixed(3)} ADA</span>
                          </div>
                          <div className="flex justify-between text-xs leading-relaxed">
                            <span className="text-gray-500 font-semibold uppercase tracking-wider text-[9px]">Annualized Yield</span>
                            <span className="font-black text-emerald-400 font-mono">+{estimatedYearly.toFixed(3)} ADA</span>
                          </div>
                        </motion.div>
                      )}

                      {!isConnected && (
                        <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-3 text-xs text-amber-300 font-medium">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-400" />
                          <span>Connect your Lace/Eternl wallet extension to delegate ADA.</span>
                        </div>
                      )}

                      <button
                        onClick={handleStake}
                        disabled={!isConnected || !stakeAmount}
                        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r ${colors.brandGradient} text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg ${colors.accentGlow} border border-white/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                      >
                        <Award className="w-4 h-4" />
                        Stake {stakeAmount ? `${stakeAmount} ADA` : "ADA"}
                      </button>
                      <p className="text-[9px] text-center text-gray-500 mt-3 font-mono">
                        This signature triggers your Lace extension to submit the delegation certificate.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
