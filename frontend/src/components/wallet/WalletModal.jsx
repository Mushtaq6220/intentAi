"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { X, Wallet, ArrowRight, Loader2, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export const WalletModal = ({ isOpen, onClose }) => {
  const { connectWallet, isConnecting, connectingWallet, connectedWallet } = useWallet();

  const [installedWallets, setInstalledWallets] = React.useState([]);

  React.useEffect(() => {
    // Dynamically fetch installed wallets to support mobile dApp browsers
    if (typeof window !== "undefined") {
      import("@meshsdk/core").then(({ BrowserWallet }) => {
        const wallets = BrowserWallet.getInstalledWallets();
        // Decorate with some UI properties for popular ones
        const decorated = wallets.map(w => {
          const lowerName = w.name.toLowerCase();
          if (lowerName.includes("lace")) {
            return { ...w, desc: "Cardano wallet by IOG", color: "from-amber-500/20 to-orange-500/20", borderColor: "hover:border-amber-500/40", glowColor: "group-hover:shadow-amber-500/10", logoText: "L", logoColor: "text-amber-400 bg-amber-500/10" };
          }
          if (lowerName.includes("eternl")) {
            return { ...w, desc: "Power-user Cardano wallet", color: "from-blue-500/20 to-indigo-500/20", borderColor: "hover:border-blue-500/40", glowColor: "group-hover:shadow-blue-500/10", logoText: "E", logoColor: "text-blue-400 bg-blue-500/10" };
          }
          if (lowerName.includes("nami")) {
            return { ...w, desc: "Simple browser extension", color: "from-emerald-500/20 to-teal-500/20", borderColor: "hover:border-emerald-500/40", glowColor: "group-hover:shadow-emerald-500/10", logoText: "N", logoColor: "text-emerald-400 bg-emerald-500/10" };
          }
          if (lowerName.includes("yoroi")) {
            return { ...w, desc: "Cardano mobile wallet", color: "from-sky-500/20 to-cyan-500/20", borderColor: "hover:border-sky-500/40", glowColor: "group-hover:shadow-sky-500/10", logoText: "Y", logoColor: "text-sky-400 bg-sky-500/10" };
          }
          // Default styling for unknown wallets
          return { ...w, desc: "Cardano Wallet Provider", color: "from-gray-500/20 to-slate-500/20", borderColor: "hover:border-gray-500/40", glowColor: "group-hover:shadow-gray-500/10", logoText: w.name.charAt(0).toUpperCase(), logoColor: "text-gray-400 bg-gray-500/10" };
        });
        setInstalledWallets(decorated);
      });
    }
  }, [isOpen]);

  const [errorMsg, setErrorMsg] = React.useState(null);
  const [missingWallet, setMissingWallet] = React.useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setMissingWallet(null);
    }
  }, [isOpen]);

  const handleConnect = async (walletName) => {
    setErrorMsg(null);
    setMissingWallet(null);
    try {
      const success = await connectWallet(walletName);
      if (success) {
        onClose();
      }
    } catch (err) {
      console.error("Wallet connection failed", err);
      if (err.message === "NOT_INSTALLED") {
        setMissingWallet(walletName);
      } else {
        setErrorMsg(err?.message || "Connection rejected or failed. Please check the extension.");
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl glass-panel p-6 shadow-2xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Connect Cardano Wallet</h3>
                  <p className="text-xs text-gray-400">Select a wallet to access testnet transactions</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Wallet List */}
            <div className="space-y-4 relative z-10">
              {installedWallets.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-white/20 text-center">
                  <p className="text-sm text-gray-400">No Cardano wallets detected. Please install a wallet extension like Lace or Eternl, or use a mobile dApp browser.</p>
                </div>
              ) : (
                installedWallets.map((wallet) => {
                  const isCurrent = connectedWallet === wallet.name;
                  return (
                  <button
                    key={wallet.name}
                    disabled={isConnecting}
                    onClick={() => handleConnect(wallet.name)}
                    className={`group w-full text-left relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-r ${wallet.color} p-4 transition-all duration-300 ${wallet.borderColor} ${wallet.glowColor} hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Custom Wallet Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg border border-white/10 ${wallet.logoColor}`}>
                          {wallet.logoText}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white group-hover:text-cyan-300 transition-colors">
                              {wallet.name}
                            </span>
                            {isCurrent && (
                              <span className="flex items-center gap-1 text-[10px] font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                                <Check className="w-2.5 h-2.5" /> Connected
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{wallet.desc}</p>
                        </div>
                      </div>
                      
                      <div className="p-1 rounded-lg bg-white/5 border border-white/5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all">
                        {isConnecting && connectingWallet === wallet.name ? (
                          <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                        )}
                      </div>
                    </div>
                  </button>
                );
                })
              )}
            </div>

            {/* Fallback / Error States */}
            <div className="mt-4 relative z-10">
              {missingWallet && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-sm font-semibold text-red-400 mb-2">
                    {missingWallet} Wallet not detected
                  </p>
                  <a
                    href={
                      missingWallet === "Lace" ? "https://www.lace.io/" :
                      missingWallet === "Eternl" ? "https://eternl.io/" :
                      "https://namiwallet.io/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Install {missingWallet} Extension
                  </a>
                </div>
              )}
              
              {errorMsg && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-xs font-medium text-amber-400">{errorMsg}</p>
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <p className="text-[11px] text-center text-gray-500 mt-6">
              By connecting your wallet, you agree to our terms of service. Transactions will be executed on the Cardano preprod testnet.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
