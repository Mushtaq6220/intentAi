"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNetwork } from "@/context/NetworkContext";
import { useWallet } from "@/context/WalletContext";
import {
  ChevronDown, Globe, AlertTriangle, ShieldAlert,
  Coins, HelpCircle, X, Check, ArrowRight, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const NetworkSwitcher = () => {
  const { activeNetwork, setNetwork, colors, networkName } = useNetwork();
  const { isConnected, meshWallet } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelectNetwork = (network) => {
    setIsOpen(false);
    if (network === activeNetwork) return;

    if (network === "mainnet") {
      // Trigger warning modal before entering mainnet
      setShowWarningModal(true);
    } else {
      // Switch back to preprod immediately
      setNetwork("preprod");
    }
  };

  const confirmSwitchToMainnet = async () => {
    setNetwork("mainnet");
    setShowWarningModal(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Network Switcher Trigger Button ──────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-${colors.accent}-500/30 text-gray-300 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer shadow-sm select-none`}
      >
        <span className={`w-2 h-2 rounded-full ${colors.pulseBg} animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.5)]`} />
        <span className="text-xs font-bold font-mono tracking-wide hidden sm:inline">{networkName}</span>
        <span className="text-xs font-bold font-mono tracking-wide sm:hidden">
          {activeNetwork === "mainnet" ? "Main" : "Test"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* ── Switcher Dropdown ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute right-0 mt-2.5 w-60 rounded-2xl solid-dropdown p-2.5 shadow-2xl z-[100] border border-white/5 overflow-hidden"
          >
            {/* Subtle background glow */}
            <div className={`absolute top-0 right-0 w-20 h-20 bg-${colors.accent}-500/10 rounded-full blur-2xl pointer-events-none`} />

            <div className="relative z-10 space-y-1">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-extrabold px-3 py-1.5 block">Select Network</span>

              {/* Preprod option */}
              <button
                onClick={() => handleSelectNetwork("preprod")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeNetwork === "preprod"
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-xs font-mono">Preprod Testnet</span>
                </div>
                {activeNetwork === "preprod" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              {/* Mainnet option */}
              <button
                onClick={() => handleSelectNetwork("mainnet")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeNetwork === "mainnet"
                    ? "bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span className="text-xs font-mono">Cardano Mainnet</span>
                </div>
                {activeNetwork === "mainnet" && <Check className="w-3.5 h-3.5 text-rose-400" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Premium Warning Confirmation Modal (Mainnet Warning) ────────── */}
      <AnimatePresence>
        {showWarningModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWarningModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed inset-0 flex items-center justify-center z-[201] p-4 pointer-events-none"
            >
              <div className="relative w-full max-w-lg bg-[#0e0e1b] border border-rose-500/20 rounded-3xl p-6.5 shadow-[0_0_50px_rgba(244,63,94,0.15)] overflow-hidden pointer-events-auto">
                {/* Glowing gold/red accent lines */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

                <button
                  onClick={() => setShowWarningModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="space-y-6">
                  {/* Warning Header */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
                      <ShieldAlert className="w-6 h-6 text-rose-500 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-none">Security Advisory</span>
                      <h4 className="text-lg font-black text-white mt-1 leading-none">Entering Cardano Mainnet</h4>
                    </div>
                  </div>

                  <p className="text-xs leading-relaxed text-gray-300">
                    You are switching from the Preprod sandbox to the <span className="font-extrabold text-white">Cardano Mainnet</span>. This environment executes real transactions using real ADA and digital assets. Please read the advisories below before confirming.
                  </p>

                  {/* Advisories Grid */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">Real Value Assets</span>
                        <span className="text-[11px] text-gray-400 leading-relaxed mt-1 block">
                          Mainnet execution involves real funds. Any tokens sent, swapped, or staked represent real financial value. Transaction mistakes cannot be reversed.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <Coins className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">Estimated Ledger Fees</span>
                        <span className="text-[11px] text-gray-400 leading-relaxed mt-1 block">
                          Cardano network ledger fees (typically <span className="font-mono text-white font-bold">0.17 to 0.35 ADA</span>) are dynamically calculated on-chain. Swap contracts incur additional script execution and batcher fees (~2.0 to 4.0 ADA).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5">
                      <Globe className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-white block">DEX Liquidity & Pricing</span>
                        <span className="text-[11px] text-gray-400 leading-relaxed mt-1 block">
                          Mainnet swaps query real, live liquidity pools. Swapping very large amounts relative to pool balances can cause substantial slippage and price impact.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Staking Info Alert */}
                  <div className="p-3 rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[10px] text-rose-300 leading-relaxed">
                      Staking on Cardano is non-custodial and secure. Staked ADA remains in your wallet at all times under your ownership. Staking operations require a 2.0 ADA deposit, refundable upon unstaking.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-3.5 pt-2">
                    <button
                      onClick={confirmSwitchToMainnet}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-extrabold text-xs transition-all shadow-lg shadow-rose-500/10 border border-rose-400/20 active:scale-[0.98] cursor-pointer"
                    >
                      <span>Switch to Mainnet</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowWarningModal(false)}
                      className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
