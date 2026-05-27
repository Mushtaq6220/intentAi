"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { 
  ArrowRight, Bot, Shield, Zap, Sparkles, Terminal, Cpu, Sun, Moon, 
  Layers, Lock, Database, ArrowUpRight, BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const LandingPage = ({
  onEnterDashboard,
  onOpenConnectModal,
}) => {
  const { isConnected, connectedWallet } = useWallet();
  const { theme, toggleTheme } = useTheme();
  
  // Interactive Boot Sequence State for Jarvis terminal vibe
  const [bootStep, setBootStep] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);

  const bootLogs = [
    "INITIALIZING CORE SYSTEM PROTOCOLS...",
    "ESTABLISHING SECURE CARDANO preprod RPC CHANNEL...",
    "DECODING EUTXO TRANSACTION COMPILER DATUMS...",
    "MOUNTING LLAMA-3 INTENT INTERPRETER CORE v1.4...",
    "ADA INTENT FINANCIAL OS IS ACTIVE."
  ];

  useEffect(() => {
    if (bootStep < bootLogs.length) {
      const timer = setTimeout(() => {
        setBootStep(prev => prev + 1);
      }, 550);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setBootComplete(true);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [bootStep]);

  const taglines = [
    "Natural Language Meets Real Blockchain Execution.",
    "Talk to AI. Move the Blockchain.",
    "Your AI-Powered Cardano Financial Operating System.",
    "The Future of Intelligent Crypto Execution."
  ];
  
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTaglineIdx(prev => (prev + 1) % taglines.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", stiffness: 90, damping: 15 } 
    },
  };

  return (
    <div className="relative min-h-screen w-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] overflow-hidden px-4 md:px-8 transition-colors duration-300">
      {/* ── Immersive Spatial Backdrops ──────────────────────────────── */}
      <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />
      
      {/* Dynamic Animated Atmospheric Lighting */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[130px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-purple-600/10 blur-[150px] animate-float-slower pointer-events-none" />
      <div className="absolute top-10 right-10 w-[300px] h-[300px] rounded-full bg-rose-500/5 blur-[120px] pointer-events-none" />
      
      {/* Interactive Floating Glowing Particle Lines (Tesla / Cyberpunk vibe) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-[20%] left-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent rotate-6" />
        <div className="absolute bottom-[25%] left-[-10%] w-[120%] h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent -rotate-3" />
      </div>

      {/* Top Header Panel */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shrink-0">
            <img src="/logo-avatar.png" alt="IntentAi Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-widest bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent uppercase leading-none">
              IntentAi
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl glass-panel glass-panel-hover text-gray-300 hover:text-white border border-white/5 transition-all cursor-pointer backdrop-blur-md active:scale-95 flex items-center justify-center shadow-lg shadow-black/40"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-cyan-400" />}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!bootComplete ? (
          /* ── Simulated Jarvis System Boot Terminal ────────────────────── */
          <motion.div
            key="boot"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-lg p-6.5 rounded-3xl glass-panel relative border border-cyan-500/10 shadow-[0_0_50px_rgba(6,182,212,0.06)]"
          >
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
            <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
              <Terminal className="w-5 h-5 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">SYS_INITIALIZE_KERNEL</span>
            </div>
            
            <div className="space-y-2.5 font-mono text-[11px] leading-relaxed">
              {bootLogs.slice(0, bootStep).map((log, index) => {
                const isLast = index === bootLogs.length - 1;
                return (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-cyan-500/70">{">"}</span>
                    <span className={isLast ? "text-cyan-400 font-extrabold" : "text-gray-300 font-medium"}>
                      {log}
                    </span>
                    {isLast && <span className="w-1.5 h-3.5 bg-cyan-400 animate-pulse" />}
                  </div>
                );
              })}
              {bootStep < bootLogs.length && (
                <div className="flex items-center gap-2">
                  <span className="text-cyan-500/70">{">"}</span>
                  <div className="w-24 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 0.55 }}
                      className="h-full bg-cyan-500" 
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── Futuristic Main Interactive OS Lobby ──────────────────────── */
          <motion.div
            key="content"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl text-center z-10 space-y-9 pt-16 pb-12"
          >
            {/* Ambient Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-md shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-300 font-mono">
                IntentAi Financial OS
              </span>
            </motion.div>

            {/* Core Animated Hero Headings */}
            <motion.div variants={itemVariants} className="space-y-4">
              <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-none text-white">
                Next-Gen AI Crypto <br />
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent text-glow-cyan">
                  Financial Operating System
                </span>
              </h1>

              {/* Dynamic Tagline Carousel (Arc / Jarvis aesthetic) */}
              <div className="h-8 md:h-10 flex items-center justify-center overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={taglineIdx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 14 }}
                    className="text-xs md:text-sm bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent font-extrabold uppercase tracking-widest text-glow-cyan"
                  >
                    {taglines[taglineIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <p className="text-xs md:text-base text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed mt-2.5">
                Bridge natural human language with secure Cardano blockchain parameters. Authorize staking, manage cross-token swaps, or dispatch payments directly through a high-performance conversational terminal.
              </p>
            </motion.div>

            {/* Dashboard and Sandbox Access Center */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4.5 max-w-md mx-auto">
              {isConnected ? (
                <button
                  onClick={onEnterDashboard}
                  className="group w-full flex items-center justify-center gap-2 px-8 py-4.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 shadow-xl shadow-cyan-500/20 border border-cyan-400/20 active:scale-[0.98] cursor-pointer"
                >
                  Enter Financial Terminal
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenConnectModal}
                    className="w-full px-7 py-4.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-black text-sm transition-all duration-300 shadow-xl shadow-cyan-500/20 border border-cyan-400/20 active:scale-[0.98] cursor-pointer"
                  >
                    Connect Cardano Wallet
                  </button>
                  <button
                    onClick={onEnterDashboard}
                    className="w-full px-7 py-4.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-cyan-500/20 text-white font-bold text-sm transition-all duration-300 active:scale-[0.98] cursor-pointer shadow-md"
                  >
                    Explore Sandbox OS
                  </button>
                </>
              )}
            </motion.div>

            {/* Futuristic Tech Grid Features */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10 text-left max-w-5xl mx-auto"
            >
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-5 shrink-0 shadow-lg shadow-cyan-500/5">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm tracking-wide">Conversational Intent Engine</h3>
                  <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed font-medium">
                    State complex goals like <code className="text-cyan-400 font-mono bg-cyan-500/5 px-1.5 py-0.5 rounded border border-cyan-500/10">“Swap 100 ADA for USDM and stake rest”</code>. The AI parses the parameters instantly.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 shrink-0 shadow-lg shadow-purple-500/5">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm tracking-wide">Secure Non-Custodial Signing</h3>
                  <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed font-medium">
                    The AI terminal generates and plans the ledger execution blueprint, but all transaction signing is completed securely within your CIP-30 wallet extension.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-2xl" />
                <div>
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-5 shrink-0 shadow-lg shadow-pink-500/5">
                    <Zap className="w-5 h-5 text-pink-400" />
                  </div>
                  <h3 className="font-bold text-white text-sm tracking-wide">Multi-DEX Aggregation & Yield</h3>
                  <p className="text-[11px] text-gray-400 mt-2.5 leading-relaxed font-medium">
                    Query real-time pool indices for swaps (like Minswap V2) and optimize rewards by delegating directly to highly responsive validator nodes.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer system details */}
      <div className="absolute bottom-6 flex items-center gap-4 text-[9px] text-gray-600 font-mono tracking-widest select-none">
        <span>© 2026 INTENTAI FINANCIAL OS</span>
        <span className="w-1 h-1 rounded-full bg-gray-700" />
        <span>ALL TRANSACTIONS SECURE ON-CHAIN</span>
      </div>
    </div>
  );
};
