"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import {
  TrendingUp, Shield, Clock, Award, ChevronRight, Zap, Lock,
  BarChart2, Layers, CheckCircle, AlertCircle, Loader2, X, Info
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
    description: "Institutional-grade pool with 99.8% uptime and transparent operations since 2021.",
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
    lockDuration: "30 Days",
    lockDays: 30,
    minStake: 10,
    totalStaked: "31.5M",
    delegates: 876,
    uptime: 99.5,
    riskLevel: "low",
    description: "High-performance validator optimized for consistent epoch rewards and low saturation.",
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
    lockDuration: "60 Days",
    lockDays: 60,
    minStake: 50,
    totalStaked: "18.2M",
    delegates: 512,
    uptime: 98.9,
    riskLevel: "medium",
    description: "Premium yield pool. Higher APY with a 60-day lock period and performance-based bonuses.",
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
    lockDuration: "14 Days",
    lockDays: 14,
    minStake: 20,
    totalStaked: "25.6M",
    delegates: 743,
    uptime: 99.6,
    riskLevel: "low",
    description: "Community-governed pool with transparent on-chain governance and bi-weekly reward distributions.",
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
    description: "Reliable Mainnet pool supporting decentralization with zero hidden fees.",
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
    description: "High-performance mainnet pool driving community growth and stable rewards.",
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
    <div className="flex-1 overflow-y-auto bg-black/10">
      {/* Header */}
      <div className="px-8 py-6 border-b border-white/5 bg-black/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${colors.brandGradient} flex items-center justify-center ${colors.accentGlow}`}>
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              ADA Staking
            </h2>
            <p className="text-xs text-gray-400 mt-1 ml-12">Earn passive yield by delegating ADA to Cardano validator pools</p>
          </div>

          {/* Portfolio Summary */}
          {isConnected && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Available</span>
                <span className="text-lg font-bold text-white font-mono">
                  {typeof adaBalance === "number" ? adaBalance.toFixed(2) : "—"}{" "}
                  <span className={`text-xs ${colors.textAccent}`}>ADA</span>
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Staked</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  250.00 <span className="text-xs text-emerald-300">ADA</span>
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block uppercase tracking-wider">Total Rewards</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  +3.24 <span className="text-xs text-amber-300">ADA</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 mt-5 bg-white/5 rounded-xl p-1 w-fit">
          {[
            { id: "pools", label: "Stake Pools" },
            { id: "portfolio", label: "My Stakes" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === tab.id
                  ? `bg-gradient-to-r ${colors.brandGradient} text-white border border-white/10`
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        {activeView === "pools" && (
          <>
            {/* Info Banner */}
            <div className="mb-6 p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/15 flex items-start gap-3">
              <Info className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-xs text-cyan-200 leading-relaxed">
                Staking on Cardano is non-custodial. Your ADA never leaves your wallet — you delegate voting/block production rights to a pool.
                Rewards are distributed every 5-day epoch.{" "}
                <span className="text-cyan-400 font-semibold">Lock periods apply to bonus pools only.</span>
              </p>
            </div>

            {/* Pool Grid */}
            <div className="grid gap-5 md:grid-cols-2">
              {activePools.map((pool, idx) => (
                <motion.div
                  key={pool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  className={`relative rounded-2xl bg-gradient-to-br ${pool.gradient} border ${pool.border} p-5 flex flex-col gap-4 hover:shadow-xl ${pool.glow} transition-all duration-300 group cursor-pointer overflow-hidden`}
                  onClick={() => handleSelectPool(pool)}
                >
                  {/* Glow BG */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${pool.badge}`}>
                          {pool.ticker}
                        </span>
                        {pool.riskLevel === "low" && (
                          <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                            LOW RISK
                          </span>
                        )}
                        {pool.riskLevel === "medium" && (
                          <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded font-mono">
                            MED RISK
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-white text-base">{pool.name}</h3>
                    </div>
                    {/* APY Big Number */}
                    <div className="text-right">
                      <span className={`text-3xl font-black font-mono ${pool.accent}`}>{pool.apy}%</span>
                      <span className="text-[9px] text-gray-400 block">APY</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed">{pool.description}</p>

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Lock className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-bold text-white block">{pool.lockDuration}</span>
                      <span className="text-[9px] text-gray-500">Lock Period</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart2 className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-bold text-white block">{pool.totalStaked} ADA</span>
                      <span className="text-[9px] text-gray-500">Total Staked</span>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-black/30 border border-white/5">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Zap className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="text-[10px] font-bold text-white block">{pool.uptime}%</span>
                      <span className="text-[9px] text-gray-500">Uptime</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <button className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r ${pool.gradient} border ${pool.border} text-white group-hover:opacity-90 transition-all`}>
                    <span>Stake ADA</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeView === "portfolio" && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <h3 className="text-sm font-semibold text-gray-300">Active Staking Positions</h3>

            {!isConnected ? (
              <div className="text-center p-12 border border-dashed border-white/10 rounded-2xl">
                <Shield className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">Connect your wallet to view staking positions</p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Total Staked", value: "250.00 ADA", sub: "1 active pool", color: "text-cyan-400" },
                    { label: "Accumulated Rewards", value: "+3.24 ADA", sub: "≈ $1.42 USD", color: "text-emerald-400" },
                    { label: "Avg APY", value: "5.20%", sub: "annualized", color: "text-amber-400" },
                  ].map((card) => (
                    <div key={card.label} className="p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                      <span className={`text-lg font-bold font-mono block ${card.color}`}>{card.value}</span>
                      <span className="text-[10px] text-gray-400 block mt-1">{card.label}</span>
                      <span className="text-[9px] text-gray-600 block">{card.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Active Stakes */}
                {USER_STAKES.map((stake, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/5 border border-cyan-500/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="font-bold text-white text-sm">{stake.pool}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                          <span className="text-[10px] text-emerald-400 font-medium">ACTIVE · Day {stake.days}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-white font-mono">{stake.apy}%</span>
                        <span className="text-[9px] text-gray-400 block">APY</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[9px] text-gray-500 block uppercase">Staked Amount</span>
                        <span className="text-sm font-bold text-white font-mono mt-0.5 block">{stake.amount} ADA</span>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                        <span className="text-[9px] text-gray-500 block uppercase">Rewards Earned</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">+{stake.rewards} ADA</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-1 flex justify-between text-[9px] text-gray-500">
                      <span>Epoch Progress</span>
                      <span>Day {stake.days % 5}/5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 border border-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                        style={{ width: `${((stake.days % 5) / 5) * 100}%` }}
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all">
                        Claim Rewards
                      </button>
                      <button className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 transition-all">
                        Unstake
                      </button>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Stake Modal */}
      <AnimatePresence>
        {selectedPool && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedPool(null); setStakeState("idle"); }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="relative w-full max-w-md bg-[#0c0c16]/98 border border-white/10 rounded-2xl p-6 shadow-2xl overflow-hidden">
                {/* BG Glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                {stakeState !== "success" && (
                  <button
                    onClick={() => { setSelectedPool(null); setStakeState("idle"); }}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="relative z-10">
                  {stakeState === "staking" ? (
                    <div className="text-center py-8 space-y-4">
                      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
                      <h4 className="text-lg font-bold text-white">Staking in Progress</h4>
                      <p className="text-xs text-gray-400">
                        Please approve the transaction in your Lace wallet. Your ADA will be delegated to{" "}
                        <span className={`font-semibold ${colors.textAccent}`}>{selectedPool.name}</span>.
                      </p>
                    </div>
                  ) : stakeState === "success" ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-7 h-7 text-emerald-400" />
                      </div>
                      <h4 className="text-lg font-bold text-white">Staking Successful! 🎉</h4>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Your <span className="text-white font-bold">{stakeAmount} ADA</span> has been delegated to{" "}
                        <span className={`font-semibold ${colors.textAccent}`}>{selectedPool.name}</span>. Rewards will begin accumulating at the next epoch boundary.
                      </p>
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 text-center">
                        Est. Monthly Reward: <span className="font-bold">{estimatedMonthly.toFixed(3)} ADA</span>
                      </div>
                      <button
                        onClick={() => { setSelectedPool(null); setStakeState("idle"); setActiveView("portfolio"); }}
                        className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${colors.brandGradient} text-white font-bold text-sm transition-all`}
                      >
                        View Portfolio
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Pool Info Header */}
                      <div className="mb-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-white text-lg">{selectedPool.name}</h3>
                            <span className={`text-xs font-mono ${selectedPool.accent}`}>{selectedPool.ticker}</span>
                          </div>
                          <div className="text-right">
                            <span className={`text-3xl font-black font-mono ${selectedPool.accent}`}>{selectedPool.apy}%</span>
                            <span className="text-[9px] text-gray-400 block">APY</span>
                          </div>
                        </div>
                      </div>

                      {/* Pool Stats */}
                      <div className="grid grid-cols-3 gap-2 mb-5">
                        {[
                          { label: "Lock", value: selectedPool.lockDuration, icon: <Lock className="w-3 h-3" /> },
                          { label: "Uptime", value: `${selectedPool.uptime}%`, icon: <Zap className="w-3 h-3" /> },
                          { label: "Min Stake", value: `${selectedPool.minStake} ADA`, icon: <Layers className="w-3 h-3" /> },
                        ].map((s) => (
                          <div key={s.label} className="text-center p-2 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">{s.icon}</div>
                            <span className="text-[10px] font-bold text-white block">{s.value}</span>
                            <span className="text-[9px] text-gray-500">{s.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Amount Input */}
                      <div className="mb-4">
                        <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block mb-2">
                          Stake Amount (ADA)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min={selectedPool.minStake}
                            value={stakeAmount}
                            onChange={(e) => { setStakeAmount(e.target.value); setErrorMsg(""); }}
                            placeholder={`Min. ${selectedPool.minStake} ADA`}
                            className="w-full py-3 px-4 pr-20 rounded-xl bg-white/5 border border-white/10 focus:border-cyan-500/40 outline-none text-white font-mono text-sm placeholder-gray-600 transition-colors"
                          />
                          <button
                            onClick={() => adaBalance && setStakeAmount(Math.floor(adaBalance).toString())}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-cyan-400 px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/20 transition-colors"
                          >
                            MAX
                          </button>
                        </div>
                        {errorMsg && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-rose-400">
                            <AlertCircle className="w-3 h-3" />
                            {errorMsg}
                          </div>
                        )}
                      </div>

                      {/* Reward Preview */}
                      {stakeAmount && parseFloat(stakeAmount) >= selectedPool.minStake && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 space-y-2"
                        >
                          <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">
                            Estimated Rewards
                          </span>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Monthly</span>
                            <span className="font-bold text-white font-mono">+{estimatedMonthly.toFixed(3)} ADA</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Yearly</span>
                            <span className="font-bold text-emerald-400 font-mono">+{estimatedYearly.toFixed(3)} ADA</span>
                          </div>
                        </motion.div>
                      )}

                      {!isConnected && (
                        <div className="mb-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-2 text-xs text-amber-300">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          Connect your Lace wallet to stake ADA on Cardano testnet.
                        </div>
                      )}

                      <button
                        onClick={handleStake}
                        disabled={!isConnected || !stakeAmount}
                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r ${colors.brandGradient} text-white font-bold text-sm transition-all shadow-lg ${colors.accentGlow} border ${colors.accentBorder} disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        <Award className="w-4 h-4" />
                        Stake {stakeAmount ? `${stakeAmount} ADA` : "ADA"}
                      </button>
                      <p className="text-[10px] text-center text-gray-500 mt-2">
                        This will trigger your Lace wallet to sign the delegation certificate.
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
