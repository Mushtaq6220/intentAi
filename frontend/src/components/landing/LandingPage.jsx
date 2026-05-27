"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { ArrowRight, Bot, Shield, Zap, Sparkles, Terminal, Cpu, Sun, Moon } from "lucide-react";
import { motion } from "framer-motion";


export const LandingPage = ({
  onEnterDashboard,
  onOpenConnectModal,
}) => {
  const { isConnected, connectedWallet } = useWallet();
  const { theme, toggleTheme } = useTheme();


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#05050a] overflow-hidden px-4 md:px-8">
      {/* Background Radial Lights and Grid */}
      <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />
      
      {/* Top Header Controls */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl glass-panel glass-panel-hover text-gray-300 hover:text-white border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-md active:scale-95 flex items-center justify-center shadow-lg"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
        </button>
      </div>

      {/* Neon Orbs */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[130px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/10 blur-[140px] animate-float-slower pointer-events-none" />
      
      {/* Top Banner Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 z-10 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-md"
      >
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-semibold text-gray-300">
          Cardano Hackathon Project MVP
        </span>
      </motion.div>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl text-center z-10 space-y-8"
      >
        {/* Title */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-white">
            AI-Based Intent Transaction <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent text-glow-cyan">
              System for Cardano
            </span>
          </h1>
          <p className="text-sm md:text-lg text-gray-400 max-w-2xl mx-auto font-medium leading-relaxed">
            Bridge natural human speech with blockchain execution. Type intents like <code className="text-cyan-400 font-mono">“Send 10 ADA to Rahul”</code> and let AI parse it into signed Cardano transactions.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {isConnected ? (
            <button
              onClick={onEnterDashboard}
              className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base transition-all duration-300 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 border border-cyan-400/20 active:scale-[0.98]"
            >
              Enter Dashboard ({connectedWallet})
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <>
              <button
                onClick={onOpenConnectModal}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-base transition-all duration-300 shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 border border-cyan-400/20 active:scale-[0.98]"
              >
                Connect Cardano Wallet
              </button>
              <button
                onClick={onEnterDashboard}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-base transition-all duration-300 active:scale-[0.98]"
              >
                Explore Sandbox Demo
              </button>
            </>
          )}
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left"
        >
          {/* Card 1 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-bold text-white text-base">Natural Language Core</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Translate human thoughts, conditions, and payment limits into secure blockchain parameters.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-bold text-white text-base">Non-Custodial Signing</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                AI prepares the transaction preview, but execution signing occurs safely within your connected wallet.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl glass-panel glass-panel-hover flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mb-4">
                <Zap className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="font-bold text-white text-base">Cardano Preprod Testnet</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Fully functional with testnet pipelines using Blockfrost API and Cardano Mesh transaction builder.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Footer copyright */}
      <div className="absolute bottom-6 text-[10px] text-gray-600 font-mono tracking-wider">
        © 2026 CARDANO INTENT TRANSACTION SYSTEM. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
};
