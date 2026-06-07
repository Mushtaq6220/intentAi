"use client";

import React, { useState, useRef, useEffect } from "react";
import { useBlockchain } from "@/context/BlockchainContext";
import { useNetwork } from "@/context/NetworkContext";
import { ChevronDown, Database, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const BlockchainSwitcher = () => {
  const { currentBlockchain, switchBlockchain } = useBlockchain();
  const { colors } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (chain) => {
    setIsOpen(false);
    switchBlockchain(chain);
  };

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-${colors.accent}-500/30 text-gray-300 hover:text-white transition-all duration-200 active:scale-95 cursor-pointer shadow-sm select-none`}
      >
        <Database className={`w-3.5 h-3.5 ${colors.primaryAccent}`} />
        <span className="text-xs font-black uppercase tracking-wider">
          {currentBlockchain === "cardano" ? "Cardano" : "Base"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="absolute right-0 mt-2 w-48 rounded-2xl solid-dropdown p-2 shadow-2xl z-[150] border border-white/5 bg-[#0b0b14] backdrop-blur-xl"
          >
            <div className="space-y-1">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest font-extrabold px-3 py-1.5 block">Select Blockchain</span>

              <button
                onClick={() => handleSelect("cardano")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  currentBlockchain === "cardano"
                    ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent font-medium"
                }`}
              >
                <span className="text-xs font-semibold">Cardano</span>
                {currentBlockchain === "cardano" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              <button
                onClick={() => handleSelect("base")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  currentBlockchain === "base"
                    ? "bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold"
                    : "hover:bg-white/5 text-gray-400 hover:text-white border border-transparent font-medium"
                }`}
              >
                <span className="text-xs font-semibold">Base (Ethereum L2)</span>
                {currentBlockchain === "base" && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
