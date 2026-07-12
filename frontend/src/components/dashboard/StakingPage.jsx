"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useNetwork } from "@/context/NetworkContext";
import { useTheme } from "@/context/ThemeContext";
import {
  TrendingUp, Shield, Zap, BarChart2, Layers, CheckCircle,
  AlertCircle, Loader2, X, Sparkles, Search, Filter,
  ArrowUpRight, ChevronUp, ChevronDown, Wallet, Star,
  RefreshCw, Award, Users, Info, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Transaction } from "@meshsdk/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// ─── Static per-pool color definitions (no dynamic class construction) ─────────
const POOL_STYLES = [
  {
    cardLight: "bg-white border-cyan-200 hover:border-cyan-400 hover:shadow-cyan-100",
    cardDark: "bg-[#050510] border-cyan-900/40 hover:border-cyan-500/60 hover:shadow-cyan-500/10",
    accentLight: "text-cyan-600",
    accentDark: "text-cyan-400",
    badgeLight: "bg-cyan-50 text-cyan-700 border-cyan-200",
    badgeDark: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
    barLight: "bg-cyan-500",
    barDark: "bg-cyan-400",
    glowLight: "shadow-cyan-100",
    glowDark: "shadow-cyan-500/10",
    gradientLight: "from-cyan-50 to-blue-50",
    gradientDark: "from-cyan-500/10 to-blue-600/5",
    ctaLight: "bg-cyan-600 hover:bg-cyan-700 text-white",
    ctaDark: "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300",
    iconBgLight: "bg-cyan-100",
    iconBgDark: "bg-cyan-500/10 border-cyan-500/20",
    trendingPillLight: "bg-cyan-600 text-white",
    trendingPillDark: "bg-cyan-500/15 border-cyan-500/25 text-cyan-300",
  },
  {
    cardLight: "bg-white border-purple-200 hover:border-purple-400 hover:shadow-purple-100",
    cardDark: "bg-[#050510] border-purple-900/40 hover:border-purple-500/60 hover:shadow-purple-500/10",
    accentLight: "text-purple-600",
    accentDark: "text-purple-400",
    badgeLight: "bg-purple-50 text-purple-700 border-purple-200",
    badgeDark: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    barLight: "bg-purple-500",
    barDark: "bg-purple-400",
    glowLight: "shadow-purple-100",
    glowDark: "shadow-purple-500/10",
    gradientLight: "from-purple-50 to-violet-50",
    gradientDark: "from-purple-500/10 to-violet-600/5",
    ctaLight: "bg-purple-600 hover:bg-purple-700 text-white",
    ctaDark: "bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300",
    iconBgLight: "bg-purple-100",
    iconBgDark: "bg-purple-500/10 border-purple-500/20",
    trendingPillLight: "bg-purple-600 text-white",
    trendingPillDark: "bg-purple-500/15 border-purple-500/25 text-purple-300",
  },
  {
    cardLight: "bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    cardDark: "bg-[#050510] border-emerald-900/40 hover:border-emerald-500/60 hover:shadow-emerald-500/10",
    accentLight: "text-emerald-600",
    accentDark: "text-emerald-400",
    badgeLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeDark: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    barLight: "bg-emerald-500",
    barDark: "bg-emerald-400",
    glowLight: "shadow-emerald-100",
    glowDark: "shadow-emerald-500/10",
    gradientLight: "from-emerald-50 to-teal-50",
    gradientDark: "from-emerald-500/10 to-teal-600/5",
    ctaLight: "bg-emerald-600 hover:bg-emerald-700 text-white",
    ctaDark: "bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300",
    iconBgLight: "bg-emerald-100",
    iconBgDark: "bg-emerald-500/10 border-emerald-500/20",
    trendingPillLight: "bg-emerald-600 text-white",
    trendingPillDark: "bg-emerald-500/15 border-emerald-500/25 text-emerald-300",
  },
  {
    cardLight: "bg-white border-amber-200 hover:border-amber-400 hover:shadow-amber-100",
    cardDark: "bg-[#050510] border-amber-900/40 hover:border-amber-500/60 hover:shadow-amber-500/10",
    accentLight: "text-amber-600",
    accentDark: "text-amber-400",
    badgeLight: "bg-amber-50 text-amber-700 border-amber-200",
    badgeDark: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    barLight: "bg-amber-500",
    barDark: "bg-amber-400",
    glowLight: "shadow-amber-100",
    glowDark: "shadow-amber-500/10",
    gradientLight: "from-amber-50 to-orange-50",
    gradientDark: "from-amber-500/10 to-orange-600/5",
    ctaLight: "bg-amber-600 hover:bg-amber-700 text-white",
    ctaDark: "bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300",
    iconBgLight: "bg-amber-100",
    iconBgDark: "bg-amber-500/10 border-amber-500/20",
    trendingPillLight: "bg-amber-600 text-white",
    trendingPillDark: "bg-amber-500/15 border-amber-500/25 text-amber-300",
  },
  {
    cardLight: "bg-white border-rose-200 hover:border-rose-400 hover:shadow-rose-100",
    cardDark: "bg-[#050510] border-rose-900/40 hover:border-rose-500/60 hover:shadow-rose-500/10",
    accentLight: "text-rose-600",
    accentDark: "text-rose-400",
    badgeLight: "bg-rose-50 text-rose-700 border-rose-200",
    badgeDark: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    barLight: "bg-rose-500",
    barDark: "bg-rose-400",
    glowLight: "shadow-rose-100",
    glowDark: "shadow-rose-500/10",
    gradientLight: "from-rose-50 to-pink-50",
    gradientDark: "from-rose-500/10 to-pink-600/5",
    ctaLight: "bg-rose-600 hover:bg-rose-700 text-white",
    ctaDark: "bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300",
    iconBgLight: "bg-rose-100",
    iconBgDark: "bg-rose-500/10 border-rose-500/20",
    trendingPillLight: "bg-rose-600 text-white",
    trendingPillDark: "bg-rose-500/15 border-rose-500/25 text-rose-300",
  },
  {
    cardLight: "bg-white border-sky-200 hover:border-sky-400 hover:shadow-sky-100",
    cardDark: "bg-[#050510] border-sky-900/40 hover:border-sky-500/60 hover:shadow-sky-500/10",
    accentLight: "text-sky-600",
    accentDark: "text-sky-400",
    badgeLight: "bg-sky-50 text-sky-700 border-sky-200",
    badgeDark: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    barLight: "bg-sky-500",
    barDark: "bg-sky-400",
    glowLight: "shadow-sky-100",
    glowDark: "shadow-sky-500/10",
    gradientLight: "from-sky-50 to-indigo-50",
    gradientDark: "from-sky-500/10 to-indigo-600/5",
    ctaLight: "bg-sky-600 hover:bg-sky-700 text-white",
    ctaDark: "bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 text-sky-300",
    iconBgLight: "bg-sky-100",
    iconBgDark: "bg-sky-500/10 border-sky-500/20",
    trendingPillLight: "bg-sky-600 text-white",
    trendingPillDark: "bg-sky-500/15 border-sky-500/25 text-sky-300",
  },
];

function getStyle(idx) { return POOL_STYLES[idx % POOL_STYLES.length]; }

// ─── Saturation Bar ──────────────────────────────────────────────────────────
const SatBar = ({ pct, barLight, barDark, isLight }) => (
  <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-700 ${pct > 80 ? "bg-rose-500" : pct > 50 ? "bg-amber-500" : isLight ? barLight : barDark}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  </div>
);

// ─── Stat chip ───────────────────────────────────────────────────────────────
const StatChip = ({ icon: Icon, label, value, accentClass, isLight }) => (
  <div className={`flex flex-col gap-0.5 p-2.5 rounded-xl border ${isLight ? "bg-slate-50 border-slate-100" : "bg-white/3 border-white/5"}`}>
    <div className={`flex items-center gap-1 ${isLight ? "text-slate-400" : "text-gray-500"}`}>
      <Icon className="w-3 h-3 shrink-0" />
      <span className="text-[8px] font-bold uppercase tracking-widest truncate">{label}</span>
    </div>
    <span className={`text-[11px] font-black font-mono leading-tight truncate ${accentClass}`}>{value}</span>
  </div>
);

// ─── Pool Card ───────────────────────────────────────────────────────────────
const PoolCard = ({ pool, idx, onSelect, isLight }) => {
  const s = getStyle(idx);
  const accent = isLight ? s.accentLight : s.accentDark;
  const badge  = isLight ? s.badgeLight  : s.badgeDark;
  const card   = isLight ? s.cardLight   : s.cardDark;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06 }}
      onClick={() => onSelect(pool, s)}
      className={`relative rounded-2xl border p-5 flex flex-col gap-3.5 shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden ${card} hover:shadow-xl hover:scale-[1.01]`}
    >
      {/* Hover glow mesh */}
      <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${isLight ? s.gradientLight : s.gradientDark} pointer-events-none`} />

      {/* Trending badge */}
      {pool.trending && (
        <div className={`absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/15 text-amber-300 border-amber-500/25"}`}>
          <TrendingUp className="w-2.5 h-2.5" /> Hot
        </div>
      )}

      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${isLight ? s.iconBgLight : s.iconBgDark}`}>
          <span className={`text-xs font-black ${accent}`}>{pool.ticker?.slice(0, 2)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${badge}`}>{pool.ticker}</span>
            <span className={`text-[8px] px-2 py-0.5 rounded-lg font-bold border ${pool.riskLevel === "low" ? (isLight ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20") : (isLight ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-amber-500/10 text-amber-400 border-amber-500/20")}`}>
              {pool.riskLevel === "low" ? "✓ Low Risk" : "⚠ Med Risk"}
            </span>
          </div>
          <h3 className={`text-sm font-extrabold leading-tight ${isLight ? "text-slate-800" : "text-white"}`}>{pool.name}</h3>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-2xl font-black font-mono leading-none ${accent}`}>{pool.apy}%</span>
          <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${isLight ? "text-slate-400" : "text-gray-500"}`}>APY</p>
        </div>
      </div>

      {/* Description */}
      <p className={`text-[10px] leading-relaxed line-clamp-2 ${isLight ? "text-slate-500" : "text-gray-400"}`}>{pool.description}</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatChip icon={Users}    label="Stakers"  value={pool.delegates?.toLocaleString()} accentClass={accent} isLight={isLight} />
        <StatChip icon={Zap}      label="Uptime"   value={`${pool.uptime}%`}                accentClass={accent} isLight={isLight} />
        <StatChip icon={BarChart2} label="Staked"  value={`${pool.totalStaked} ₳`}          accentClass={accent} isLight={isLight} />
      </div>

      {/* Saturation */}
      <div>
        <div className={`flex justify-between text-[8px] font-bold uppercase tracking-widest mb-1.5 ${isLight ? "text-slate-400" : "text-gray-500"}`}>
          <span>Pool Saturation</span>
          <span className={pool.saturation > 80 ? "text-rose-500" : pool.saturation > 50 ? "text-amber-500" : "text-emerald-500"}>
            {pool.saturation}%
          </span>
        </div>
        <SatBar pct={pool.saturation} barLight={s.barLight} barDark={s.barDark} isLight={isLight} />
      </div>

      {/* Epoch reward estimate */}
      <div className={`flex items-center justify-between p-2.5 rounded-xl border text-[9px] bg-gradient-to-r ${isLight ? s.gradientLight : s.gradientDark} ${isLight ? "border-slate-100" : "border-white/5"}`}>
        <span className={isLight ? "text-slate-500 font-semibold" : "text-gray-400 font-semibold"}>Est. / 1000 ₳ per epoch</span>
        <span className={`font-black font-mono ${accent}`}>+{pool.epochRewardPer1000 ?? ((1000 * pool.apy / 100) / 73).toFixed(4)} ₳</span>
      </div>

      {/* CTA */}
      <button className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-200 ${isLight ? s.ctaLight : s.ctaDark} group-hover:brightness-105`}>
        <Award className="w-3.5 h-3.5" />
        Delegate Now
        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
      </button>
    </motion.div>
  );
};

// ─── Stake Modal ─────────────────────────────────────────────────────────────
const StakeModal = ({ pool, style: s, onClose, meshWallet, isConnected, adaBalance, isMainnet, isLight }) => {
  const [amount, setAmount] = useState("");
  const [phase, setPhase]   = useState("form");
  const [errMsg, setErrMsg] = useState("");

  const accent = isLight ? s.accentLight : s.accentDark;
  const badge  = isLight ? s.badgeLight  : s.badgeDark;

  const yearly  = amount ? (parseFloat(amount) || 0) * pool.apy / 100 : 0;
  const monthly = yearly / 12;
  const epochly = yearly / 73;

  const handleStake = async () => {
    if (!amount || parseFloat(amount) < (pool.minStake || 5)) {
      setErrMsg(`Minimum stake is ${pool.minStake || 5} ADA`);
      return;
    }
    setErrMsg("");
    setPhase("signing");
    try {
      const activeWallet = meshWallet;
      if (!activeWallet) {
        throw new Error("No wallet connected. Please connect your Cardano wallet first.");
      }

      const rewardAddresses = await activeWallet.getRewardAddresses();
      if (!rewardAddresses || rewardAddresses.length === 0) {
        throw new Error("No reward address found in your wallet.");
      }
      const rewardAddress = rewardAddresses[0];
      const poolId = pool.poolId;
      if (!poolId) {
        throw new Error("Pool ID not found or invalid.");
      }

      console.log(`[Stake Page] Delegating ${rewardAddress} to ${poolId}`);
      const tx = new Transaction({ initiator: activeWallet });
      tx.delegateStake(rewardAddress, poolId);

      const unsignedTx = await tx.build();
      const signedTx = await activeWallet.signTx(unsignedTx);
      const txHash = await activeWallet.submitTx(signedTx);
      
      console.log(`[Stake Page] Staked successfully! txHash:`, txHash);
      
      // Notify backend
      fetch(`${API_BASE_URL}/api/transaction/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash })
      }).catch(() => undefined);

      setPhase("success");
    } catch (e) {
      setErrMsg(e.message || "Delegation failed");
      setPhase("error");
    }
  };

  const modalBg   = isLight ? "bg-white border-slate-200 shadow-slate-200/60"     : "bg-[#06060e] border-white/10 shadow-black/60";
  const inputCls  = isLight ? "bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-400"  : "bg-[#07070f] border-white/8 text-white focus:border-cyan-500/30";
  const statBg    = isLight ? "bg-slate-50 border-slate-100"  : "bg-white/3 border-white/5";
  const textMain  = isLight ? "text-slate-800"  : "text-white";
  const textMuted = isLight ? "text-slate-500"  : "text-gray-400";

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 bg-black/70 backdrop-blur-md z-50" />

      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
      >
        <div className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl pointer-events-auto overflow-hidden ${modalBg}`}>
          {/* Ambient glow */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-br ${isLight ? s.gradientLight : s.gradientDark}`} />

          {phase !== "success" && (
            <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-lg border transition-colors cursor-pointer ${isLight ? "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200" : "bg-white/5 border-white/8 text-gray-400 hover:bg-white/10"}`}>
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="relative z-10">
            {/* ── SIGNING ── */}
            {phase === "signing" && (
              <div className="text-center py-10 space-y-4">
                <div className="relative w-14 h-14 mx-auto">
                  <div className={`absolute inset-0 rounded-full border-2 ${isLight ? "border-slate-200" : "border-white/10"}`} />
                  <div className={`absolute inset-0 rounded-full border-2 border-t-transparent animate-spin ${isLight ? "border-blue-500" : "border-cyan-400"}`} />
                  <div className="absolute inset-0 flex items-center justify-center"><Lock className={`w-5 h-5 ${accent}`} /></div>
                </div>
                <h4 className={`text-sm font-black uppercase tracking-widest ${textMain}`}>Signing Certificate</h4>
                <p className={`text-[11px] leading-relaxed ${textMuted}`}>Approve the delegation in your wallet to delegate to <span className={`font-bold ${accent}`}>{pool.name}</span>.</p>
              </div>
            )}

            {/* ── ERROR ── */}
            {phase === "error" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6 text-rose-500" />
                </div>
                <h4 className={`text-sm font-black uppercase ${textMain}`}>Delegation Failed</h4>
                <p className={`text-[11px] ${textMuted}`}>{errMsg}</p>
                <button onClick={() => setPhase("form")} className={`px-6 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700" : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"}`}>Try Again</button>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {phase === "success" && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <h4 className={`text-sm font-black uppercase tracking-wider ${textMain}`}>Delegation Active! 🎉</h4>
                <p className={`text-[11px] leading-relaxed ${textMuted}`}>
                  <span className={`font-black ${textMain}`}>{amount} ADA</span> is now delegated to <span className={`font-bold ${accent}`}>{pool.name}</span>.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Per Epoch", value: `+${epochly.toFixed(3)} ₳`, cls: "text-emerald-500" },
                    { label: "Per Month", value: `+${monthly.toFixed(3)} ₳`, cls: isLight ? "text-blue-600" : "text-cyan-400" },
                    { label: "Per Year",  value: `+${yearly.toFixed(2)} ₳`,  cls: "text-amber-500" },
                  ].map(r => (
                    <div key={r.label} className={`p-2.5 rounded-xl border ${statBg}`}>
                      <span className={`text-xs font-black font-mono block ${r.cls}`}>{r.value}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 block ${textMuted}`}>{r.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onClose} className={`w-full py-3 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer ${isLight ? s.ctaLight : s.ctaDark}`}>Done</button>
              </div>
            )}

            {/* ── FORM ── */}
            {phase === "form" && (
              <>
                {/* Pool header */}
                <div className={`flex items-center gap-3 mb-5 pb-4 border-b ${isLight ? "border-slate-100" : "border-white/5"}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${isLight ? s.iconBgLight : s.iconBgDark}`}>
                    <span className={`text-xs font-black ${accent}`}>{pool.ticker?.slice(0,2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-extrabold leading-tight ${textMain}`}>{pool.name}</h3>
                    <span className={`text-[9px] font-bold ${accent}`}>{pool.ticker}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-xl font-black font-mono ${accent}`}>{pool.apy}%</span>
                    <p className={`text-[8px] font-bold uppercase tracking-widest ${textMuted}`}>APY</p>
                  </div>
                </div>

                {/* Pool ID */}
                <div className={`mb-4 p-2.5 rounded-xl border ${statBg}`}>
                  <span className={`text-[8px] font-bold uppercase tracking-widest block mb-1 ${textMuted}`}>Pool ID</span>
                  <span className={`text-[9px] font-mono break-all leading-relaxed ${textMuted}`}>{pool.poolId}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <StatChip icon={Zap}    label="Uptime"   value={`${pool.uptime}%`}         accentClass={accent} isLight={isLight} />
                  <StatChip icon={Shield} label="Margin"   value={`${(pool.margin*100).toFixed(1)}%`} accentClass={accent} isLight={isLight} />
                  <StatChip icon={Layers} label="Min Stake" value={`${pool.minStake} ₳`}     accentClass={accent} isLight={isLight} />
                </div>

                {/* Amount input */}
                <div className="mb-4">
                  <label className={`text-[9px] font-extrabold uppercase tracking-widest block mb-2 ${textMuted}`}>Delegation Amount (ADA)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min={pool.minStake}
                      value={amount}
                      onChange={e => { setAmount(e.target.value); setErrMsg(""); }}
                      placeholder={`Min. ${pool.minStake} ADA`}
                      className={`w-full py-3.5 px-4 pr-16 rounded-xl outline-none font-mono text-sm placeholder-gray-400 transition-all border ${inputCls}`}
                    />
                    <button
                      onClick={() => adaBalance && setAmount(Math.floor(adaBalance).toString())}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black px-2 py-1 rounded-lg border cursor-pointer transition-colors ${badge}`}
                    >MAX</button>
                  </div>
                  {errMsg && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-rose-500">
                      <AlertCircle className="w-3 h-3" />{errMsg}
                    </div>
                  )}
                </div>

                {/* Projection */}
                {amount && parseFloat(amount) >= (pool.minStake || 5) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    className={`mb-4 p-3 rounded-xl border space-y-1.5 ${isLight ? "bg-emerald-50 border-emerald-100" : "bg-emerald-500/5 border-emerald-500/15"}`}>
                    <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-widest block">Reward Projection</span>
                    {[
                      { label: "Per Epoch (~5 days)", value: `+${epochly.toFixed(4)} ADA` },
                      { label: "Per Month",            value: `+${monthly.toFixed(3)} ADA` },
                      { label: "Per Year",             value: `+${yearly.toFixed(2)} ADA`  },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between text-[10px]">
                        <span className={textMuted}>{r.label}</span>
                        <span className={`font-black font-mono ${textMain}`}>{r.value}</span>
                      </div>
                    ))}
                  </motion.div>
                )}

                {!isConnected && (
                  <div className={`mb-4 p-3 rounded-xl border flex items-center gap-2.5 text-[10px] ${isLight ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-amber-500/5 border-amber-500/15 text-amber-300"}`}>
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                    Connect your Lace/Eternl wallet to delegate ADA.
                  </div>
                )}

                <button
                  onClick={handleStake}
                  disabled={!isConnected || !amount}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-extrabold text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isLight ? s.ctaLight : s.ctaDark}`}
                >
                  <Award className="w-4 h-4" />
                  Stake {amount ? `${amount} ADA` : "ADA"} to {pool.ticker}
                </button>
                <p className={`text-[8px] text-center mt-2.5 font-mono ${textMuted}`}>Non-custodial · ADA stays in your wallet · Unstake anytime</p>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
export const StakingPage = () => {
  const { isConnected, adaBalance, meshWallet } = useWallet();
  const { activeNetwork, colors, isMainnet }    = useNetwork();
  const { theme }                               = useTheme();

  const isLight = theme === "light";

  const [pools, setPools]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [sortKey, setSortKey] = useState("apy");
  const [sortDir, setSortDir] = useState("desc");
  const [filterRisk, setFilterRisk] = useState("all");
  const [activeView, setActiveView] = useState("pools");
  const [selected, setSelected]     = useState(null); // { pool, style }

  const fetchPools = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${API_BASE_URL}/api/staking/pools?network=${activeNetwork}`, {
        headers: { "X-Cardano-Network": activeNetwork }
      });
      const data = await res.json();
      if (data.success) setPools(data.pools);
      else setError("Failed to load staking pools.");
    } catch {
      setError("Could not connect to staking API.");
    } finally { setLoading(false); }
  }, [activeNetwork]);

  useEffect(() => { fetchPools(); }, [fetchPools]);

  const displayed = [...pools]
    .filter(p => {
      if (filterRisk !== "all" && p.riskLevel !== filterRisk) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.ticker.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return sortDir === "desc" ? bv - av : av - bv;
    });

  const trending = [...pools].sort((a, b) => b.apy - a.apy).slice(0, 3);

  const SortBtn = ({ col, label }) => (
    <button
      onClick={() => { if (sortKey === col) setSortDir(d => d === "desc" ? "asc" : "desc"); else { setSortKey(col); setSortDir("desc"); } }}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
        sortKey === col
          ? isLight ? "bg-blue-50 border border-blue-200 text-blue-700" : "bg-white/8 border border-white/10 text-white"
          : isLight ? "text-slate-400 hover:text-slate-700" : "text-gray-500 hover:text-gray-300"
      }`}
    >
      {label}
      {sortKey === col ? (sortDir === "desc" ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />) : <ChevronDown className="w-3 h-3 opacity-30" />}
    </button>
  );

  const headerBg = isLight ? "bg-white/80 border-slate-200/70 backdrop-blur-md" : "bg-[#030308]/50 border-white/5 backdrop-blur-md";
  const textMain  = isLight ? "text-slate-800"  : "text-white";
  const textMuted = isLight ? "text-slate-500"  : "text-gray-500";
  const inputCls  = isLight ? "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400" : "bg-[#07070f]/80 border-white/8 text-white placeholder-gray-600 focus:border-cyan-500/30";
  const toolbarBg = isLight ? "bg-white border-slate-200" : "bg-[#07070f]/80 border-white/8";


  return (
    <div className="flex-1 overflow-y-auto bg-transparent relative scrollbar-thin">
      {/* Ambient background */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-[120px] pointer-events-none transition-colors duration-500 ${isLight ? "bg-blue-100/50" : "bg-purple-500/5"}`} />

      {/* ── HEADER ── */}
      <div className={`px-6 py-5 border-b relative z-10 ${headerBg}`}>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl p-[1px] shadow-lg ${isLight ? "bg-gradient-to-tr from-blue-500 to-cyan-500" : "bg-gradient-to-tr from-cyan-400 to-purple-500"}`}>
              <div className={`w-full h-full rounded-[11px] flex items-center justify-center ${isLight ? "bg-white" : "bg-[#030308]"}`}>
                <TrendingUp className={`w-5 h-5 ${isLight ? "text-blue-600" : "text-cyan-400"}`} />
              </div>
            </div>
            <div>
              <h2 className={`text-base font-black uppercase tracking-wider leading-none ${textMain}`}>
                Cardano Staking
                <span className={`ml-2 text-xs font-black ${isLight ? "text-blue-600" : "text-cyan-400"}`}>
                  {isMainnet ? "· Mainnet" : "· Preprod Testnet"}
                </span>
              </h2>
              <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${textMuted}`}>Non-custodial ADA delegation · Rewards every ~5-day epoch</p>
            </div>
          </div>

          {isConnected && (
            <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${isLight ? "bg-white border-slate-200 shadow-sm" : "bg-white/4 border-white/8"}`}>
              <Wallet className={`w-3.5 h-3.5 ${isLight ? "text-blue-600" : "text-cyan-400"}`} />
              <div>
                <span className={`text-[8px] font-bold uppercase tracking-widest block ${textMuted}`}>Available</span>
                <span className={`text-sm font-black font-mono leading-tight ${textMain}`}>
                  {typeof adaBalance === "number" ? adaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "—"}
                  <span className={`text-[9px] ml-1 ${isLight ? "text-blue-600" : "text-cyan-400"}`}>ADA</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5">
          {[{ id: "pools", label: "🏊 Pool Explorer" }, { id: "portfolio", label: "📊 My Positions" }].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                activeView === tab.id
                  ? isLight ? "bg-blue-600 text-white shadow-md" : "bg-white/6 border border-white/10 text-cyan-400 shadow-md"
                  : isLight ? "text-slate-500 hover:text-slate-800 hover:bg-slate-100" : "text-gray-500 hover:text-gray-300"
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="p-5 md:p-6 relative z-10 space-y-6">

        {activeView === "pools" && (
          <>
            {/* Trending strip */}
            {trending.length > 0 && !loading && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${isLight ? "text-slate-700" : "text-amber-400"}`}>Top Trending Pools</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {trending.map((p, i) => {
                    const si = pools.indexOf(p);
                    const st = getStyle(si);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        onClick={() => setSelected({ pool: p, style: st })}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${isLight ? `bg-white ${st.cardLight.split(" ").filter(c => c.startsWith("border") || c.startsWith("hover:")).join(" ")} shadow-sm` : `${st.cardDark}`}`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${isLight ? st.iconBgLight : st.iconBgDark}`}>
                          <span className={`text-[9px] font-black ${isLight ? st.accentLight : st.accentDark}`}>{p.ticker?.slice(0,2)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] font-black leading-none ${textMain}`}>{p.ticker}</p>
                          <p className={`text-[8px] mt-0.5 truncate ${textMuted}`}>{p.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-base font-black font-mono ${isLight ? st.accentLight : st.accentDark}`}>{p.apy}%</span>
                          <p className="text-[8px] text-gray-500 font-bold">APY</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Info banner */}
            <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${isLight ? "bg-blue-50/60 border-blue-100" : "bg-cyan-500/5 border-cyan-500/10"}`}>
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className={`text-[10px] leading-relaxed ${isLight ? "text-slate-600" : "text-cyan-200/70"}`}>
                <span className="font-bold text-blue-600">Non-custodial staking:</span> ADA never leaves your wallet. Delegation certificates are submitted on-chain and rewards distribute every ~5-day epoch.
              </p>
            </div>

            {/* Controls toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${textMuted}`} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search pool name or ticker…"
                  className={`w-full pl-8 pr-3 py-2.5 rounded-xl text-xs outline-none transition-all border ${inputCls}`}
                />
              </div>

              {/* Risk filter */}
              <div className={`flex items-center gap-1 rounded-xl p-1 border ${toolbarBg}`}>
                {[{ v: "all", l: "All" }, { v: "low", l: "✓ Low" }, { v: "medium", l: "⚠ Med" }].map(f => (
                  <button key={f.v} onClick={() => setFilterRisk(f.v)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      filterRisk === f.v
                        ? isLight ? "bg-blue-600 text-white" : "bg-white/8 text-white"
                        : isLight ? "text-slate-400 hover:text-slate-700" : "text-gray-500 hover:text-gray-300"
                    }`}
                  >{f.l}</button>
                ))}
              </div>

              {/* Sort */}
              <div className={`flex items-center gap-1 rounded-xl px-2 py-1 border ${toolbarBg}`}>
                <Filter className="w-3 h-3 text-gray-500 mr-1" />
                <SortBtn col="apy" label="APY" />
                <SortBtn col="uptime" label="Uptime" />
                <SortBtn col="saturation" label="Sat." />
                <SortBtn col="delegates" label="Users" />
              </div>

              {/* Refresh */}
              <button onClick={fetchPools} className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${toolbarBg} ${isLight ? "text-slate-500 hover:text-slate-800" : "text-gray-400 hover:text-white"}`}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Pool grid */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className={`w-8 h-8 animate-spin ${isLight ? "text-blue-600" : "text-cyan-400"}`} />
                <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Fetching staking pools…</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
                <p className="text-xs font-bold text-rose-500">{error}</p>
                <button onClick={fetchPools} className={`mt-3 px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200" : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"}`}>Retry</button>
              </div>
            ) : displayed.length === 0 ? (
              <div className="text-center py-16">
                <Search className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className={`text-xs font-bold ${textMuted}`}>No pools match your filter.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {displayed.map((pool) => {
                  const idx = pools.indexOf(pool);
                  return (
                    <PoolCard
                      key={pool.id}
                      pool={pool}
                      idx={idx}
                      isLight={isLight}
                      onSelect={(p, s) => setSelected({ pool: p, style: s })}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeView === "portfolio" && (
          <div className="space-y-5 max-w-2xl mx-auto">
            {!isConnected ? (
              <div className={`text-center py-20 border border-dashed rounded-2xl ${isLight ? "bg-slate-50 border-slate-200" : "bg-[#030308]/30 border-white/8"}`}>
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3 animate-pulse" />
                <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>Connect your wallet to view positions</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Total Staked",    value: "250.00 ADA", sub: "1 pool",       cls: isLight ? "text-blue-600" : "text-cyan-400" },
                    { label: "Earned Rewards",  value: "+3.24 ADA",  sub: "≈ $1.42 USD",  cls: "text-emerald-500" },
                    { label: "Avg APY",         value: "5.20%",      sub: "Annual yield", cls: "text-amber-500" },
                  ].map(s => (
                    <div key={s.label} className={`p-4 rounded-xl border text-center shadow-sm ${isLight ? "bg-white border-slate-200" : "bg-[#07070f]/80 border-white/8"}`}>
                      <span className={`text-base font-black font-mono block ${s.cls}`}>{s.value}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest block mt-1.5 ${textMuted}`}>{s.label}</span>
                      <span className={`text-[8px] block mt-0.5 ${textMuted}`}>{s.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Active position */}
                <div className={`p-5 rounded-2xl border shadow-lg ${isLight ? "bg-gradient-to-br from-blue-50 to-cyan-50/30 border-blue-200" : "bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent border-cyan-500/20"}`}>
                  <div className={`flex items-center justify-between mb-4 pb-3 border-b ${isLight ? "border-blue-100" : "border-white/5"}`}>
                    <div>
                      <span className={`font-extrabold text-sm ${textMain}`}>Cardano Secure Pool</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">Active · Epoch Day 3/5</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-black font-mono ${isLight ? "text-blue-600" : "text-cyan-400"}`}>5.2%</span>
                      <p className={`text-[8px] font-bold uppercase ${textMuted}`}>APY</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Staked Amount", value: "250.00 ADA", cls: textMain },
                      { label: "Earned Rewards", value: "+3.24 ADA", cls: "text-emerald-500" },
                    ].map(s => (
                      <div key={s.label} className={`p-3 rounded-xl border ${isLight ? "bg-white border-blue-100" : "bg-[#030308]/80 border-white/5"}`}>
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest block ${textMuted}`}>{s.label}</span>
                        <span className={`text-sm font-black font-mono mt-0.5 block ${s.cls}`}>{s.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className={`mb-1 flex justify-between text-[8px] font-bold uppercase tracking-widest ${textMuted}`}>
                    <span>Epoch progress</span><span>3/5 days</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden mb-4 ${isLight ? "bg-blue-100" : "bg-white/5"}`}>
                    <div className={`h-full w-[60%] rounded-full ${isLight ? "bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-gradient-to-r from-cyan-400 to-purple-500"}`} />
                  </div>

                  <div className="flex gap-2.5">
                    <button className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 transition-all cursor-pointer">
                      Claim Rewards
                    </button>
                    <button className="flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 transition-all cursor-pointer">
                      Unstake
                    </button>
                  </div>
                </div>

                <div
                  onClick={() => setActiveView("pools")}
                  className={`flex items-center gap-3 p-4 rounded-xl border border-dashed cursor-pointer transition-colors ${isLight ? "border-slate-200 hover:bg-slate-50" : "border-white/10 hover:bg-white/3"}`}
                >
                  <Sparkles className={`w-4 h-4 ${isLight ? "text-blue-600" : "text-cyan-400"}`} />
                  <span className={`text-xs font-bold ${textMuted}`}>Explore more pools to diversify your delegation →</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── STAKE MODAL ── */}
      <AnimatePresence>
        {selected && (
          <StakeModal
            pool={selected.pool}
            style={selected.style}
            onClose={() => setSelected(null)}
            meshWallet={meshWallet}
            isConnected={isConnected}
            adaBalance={adaBalance}
            isMainnet={isMainnet}
            isLight={isLight}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
