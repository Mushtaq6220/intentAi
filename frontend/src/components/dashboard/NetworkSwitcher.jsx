"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNetwork } from "@/context/NetworkContext";
import { useWallet } from "@/context/WalletContext";
import {
  ChevronDown, Globe, AlertTriangle, ShieldAlert,
  Coins, X, Check, ArrowRight, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const NetworkSwitcher = () => {
  const { activeNetwork, setNetwork, colors, networkName } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  const openDropdown = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setIsOpen(true);
  }, []);

  const closeDropdown = useCallback(() => setIsOpen(false), []);

  const toggleDropdown = useCallback(() => {
    isOpen ? closeDropdown() : openDropdown();
  }, [isOpen, openDropdown, closeDropdown]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) closeDropdown();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isOpen, closeDropdown]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isOpen) return;
    const reposition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    };
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [isOpen]);

  const handleSelectNetwork = (network) => {
    closeDropdown();
    if (network === activeNetwork) return;
    if (network === "mainnet") {
      setShowWarningModal(true);
    } else {
      setNetwork("preprod");
    }
  };

  const confirmSwitchToMainnet = () => {
    setNetwork("mainnet");
    setShowWarningModal(false);
  };

  return (
    <div className="relative">
      {/* ── Network Switcher Trigger Button ──────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={toggleDropdown}
        className={`flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-4 py-2.5 rounded-xl bg-white/5 border transition-all duration-200 active:scale-95 cursor-pointer shadow-sm select-none ${
          isOpen
            ? "border-white/20 text-white"
            : "border-white/10 hover:border-white/20 text-gray-300 hover:text-white"
        }`}
      >
        <span className={`w-2 h-2 rounded-full ${colors.pulseBg} animate-pulse`} />
        <span className="text-xs font-bold font-mono tracking-wide hidden sm:inline">{networkName}</span>
        <span className="text-xs font-bold font-mono tracking-wide sm:hidden">
          {activeNetwork === "mainnet" ? "Main" : "Test"}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* ── Switcher Dropdown (Portal) ───────────────────────────────────── */}
      {mounted && isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            key="net-dropdown"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 320 }}
            style={{ top: dropdownPos.top, right: dropdownPos.right, zIndex: 99999 }}
            className="fixed w-56 rounded-2xl p-2.5 shadow-2xl border border-white/10 bg-[#0b0b16]/95 backdrop-blur-2xl"
          >
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-extrabold px-3 py-1.5 block">Select Network</span>

            <div className="space-y-1 mt-1">
              {/* Testnet option */}
              <button
                onClick={() => handleSelectNetwork("preprod")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeNetwork === "preprod"
                    ? `bg-${colors.accent}-500/10 text-${colors.accent}-300 border border-${colors.accent}-500/20 font-bold`
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent font-medium"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.pulseBg}`} />
                  <span className="text-xs font-mono">Preprod Testnet</span>
                </div>
                {activeNetwork === "preprod" &&
                  <Check className={`w-3.5 h-3.5 ${colors.primaryAccent}`} />}
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
        </AnimatePresence>,
        document.body
      )}

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
              <div className="relative w-full max-w-lg bg-[#0e0e1b] border border-rose-500/20 rounded-3xl p-4 sm:p-6.5 shadow-[0_0_50px_rgba(244,63,94,0.15)] max-h-[85vh] overflow-y-auto pointer-events-auto scrollbar-thin">
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

                <div className="space-y-4 sm:space-y-6">
                  {/* Warning Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-rose-500/10">
                      <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-rose-500 animate-pulse" />
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] font-bold text-rose-400 uppercase tracking-widest leading-none">Security Advisory</span>
                      <h4 className="text-base sm:text-lg font-black text-white mt-1 leading-none">Entering Cardano Mainnet</h4>
                    </div>
                  </div>

                  <p className="text-[11px] sm:text-xs leading-relaxed text-gray-300">
                    You are switching from the Preprod sandbox to the <span className="font-extrabold text-white">Cardano Mainnet</span>. This environment executes real transactions using real ADA and digital assets. Please read the advisories below before confirming.
                  </p>

                  {/* Advisories Grid */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                      <AlertTriangle className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] sm:text-xs font-bold text-white block">Real Value Assets</span>
                        <span className="text-[10px] sm:text-[11px] text-gray-400 leading-relaxed mt-1 block">
                          Mainnet execution involves real funds. Any tokens sent, swapped, or staked represent real financial value. Transaction mistakes cannot be reversed.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                      <Coins className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] sm:text-xs font-bold text-white block">Estimated Ledger Fees</span>
                        <span className="text-[10px] sm:text-[11px] text-gray-400 leading-relaxed mt-1 block">
                          Cardano network ledger fees (typically <span className="font-mono text-white font-bold">0.17 to 0.35 ADA</span>) are dynamically calculated on-chain. Swap contracts incur additional script execution and batcher fees (~2.0 to 4.0 ADA).
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-white/5 border border-white/5">
                      <Globe className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[11px] sm:text-xs font-bold text-white block">DEX Liquidity & Pricing</span>
                        <span className="text-[10px] sm:text-[11px] text-gray-400 leading-relaxed mt-1 block">
                          Mainnet swaps query real, live liquidity pools. Swapping very large amounts relative to pool balances can cause substantial slippage and price impact.
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Staking Info Alert */}
                  <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-rose-500/5 border border-rose-500/15 flex items-start gap-2 sm:gap-2.5">
                    <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 mt-0.5 shrink-0" />
                    <p className="text-[9px] sm:text-[10px] text-rose-300 leading-relaxed">
                      Staking on Cardano is non-custodial and secure. Staked ADA remains in your wallet at all times under your ownership. Staking operations require a 2.0 ADA deposit, refundable upon unstaking.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3.5 pt-1.5 sm:pt-2">
                    <button
                      onClick={confirmSwitchToMainnet}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-extrabold text-[11px] sm:text-xs transition-all shadow-lg shadow-rose-500/10 border border-rose-400/20 active:scale-[0.98] cursor-pointer"
                    >
                      <span>Switch to Mainnet</span>
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => setShowWarningModal(false)}
                      className="px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white font-bold text-[11px] sm:text-xs transition-all active:scale-[0.98] cursor-pointer"
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
