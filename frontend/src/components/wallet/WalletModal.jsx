"use client";

import React from "react";
import { useWallet } from "@/context/WalletContext";
import { X, Wallet, ArrowRight, Loader2, Check, Sparkles, Terminal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const WalletModal = ({ isOpen, onClose }) => {
  const { connectWallet, isConnecting, connectingWallet, connectedWallet } = useWallet();

  const [installedWallets, setInstalledWallets] = React.useState([]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      import("@meshsdk/core").then(({ BrowserWallet }) => {
        const wallets = BrowserWallet.getInstalledWallets() || [];
        
        // Ensure that if window.cardano has yoroi/lace/eternl/nami injected but it wasn't listed, we manually discover it
        if (window.cardano) {
          const knownIds = ["lace", "eternl", "nami", "yoroi"];
          knownIds.forEach(id => {
            if (window.cardano[id] && !wallets.some(w => w.id === id || w.name.toLowerCase() === id)) {
              wallets.push({
                id: id,
                name: id.charAt(0).toUpperCase() + id.slice(1),
                icon: window.cardano[id].icon || "",
                version: window.cardano[id].apiVersion || ""
              });
            }
          });
        }

        const decorated = wallets.map(w => {
          const lowerName = w.name.toLowerCase();
          if (lowerName.includes("lace")) {
            return { 
              ...w, 
              desc: "Cardano Wallet by IOG", 
              color: "from-amber-500/10 to-orange-500/5", 
              borderColor: "hover:border-amber-500/30", 
              glowColor: "group-hover:shadow-amber-500/10", 
              logoText: "L", 
              logoColor: "text-amber-400 bg-amber-500/15" 
            };
          }
          if (lowerName.includes("eternl")) {
            return { 
              ...w, 
              desc: "Power-User Cardano Core", 
              color: "from-blue-500/10 to-indigo-500/5", 
              borderColor: "hover:border-blue-500/30", 
              glowColor: "group-hover:shadow-blue-500/10", 
              logoText: "E", 
              logoColor: "text-blue-400 bg-blue-500/15" 
            };
          }
          if (lowerName.includes("nami")) {
            return { 
              ...w, 
              desc: "Simple and elegant cardano interface", 
              color: "from-emerald-500/10 to-teal-500/5", 
              borderColor: "hover:border-emerald-500/30", 
              glowColor: "group-hover:shadow-emerald-500/10", 
              logoText: "N", 
              logoColor: "text-emerald-400 bg-emerald-500/15" 
            };
          }
          if (lowerName.includes("yoroi")) {
            return { 
              ...w, 
              desc: "Emurgo mobile hardware gateway", 
              color: "from-sky-500/10 to-cyan-500/5", 
              borderColor: "hover:border-sky-500/30", 
              glowColor: "group-hover:shadow-sky-500/10", 
              logoText: "Y", 
              logoColor: "text-sky-400 bg-sky-500/15" 
            };
          }
          return { 
            ...w, 
            desc: "Cardano Wallet Provider Node", 
            color: "from-gray-500/10 to-slate-500/5", 
            borderColor: "hover:border-gray-500/30", 
            glowColor: "group-hover:shadow-gray-500/10", 
            logoText: w.name.charAt(0).toUpperCase(), 
            logoColor: "text-gray-400 bg-gray-500/15" 
          };
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
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          {/* Spatial Blur Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: "spring", damping: 25, stiffness: 280 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl glass-panel p-6.5 shadow-2xl"
          >
            {/* Ambient Background Glow Elements */}
            <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            {/* Header section */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 shadow-md">
                  <Wallet className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider flex items-center gap-1.5">
                    Connect Cardano Wallet <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Select a cryptonode to interface ledger</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Wallet list Grid */}
            <div className="space-y-3.5 relative z-10">
              {installedWallets.length === 0 ? (
                <div className="p-5 rounded-2xl border border-dashed border-white/10 text-center bg-[#030308]/40 space-y-3">
                  <Terminal className="w-6 h-6 text-gray-600 mx-auto" />
                  <p className="text-xs text-gray-400 font-semibold leading-relaxed">
                    No Cardano browser wallets detected. Please install Lacey, Eternl, or Yoroi, or open this platform inside a mobile Web3 browser.
                  </p>
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-left">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">📱 Mobile Connection Tip</span>
                    <span className="text-[10px] text-gray-400 leading-normal block mt-1 font-semibold">
                      To connect on iOS or Android, please open this website inside the built-in dApp browser of your Yoroi or Lace mobile application.
                    </span>
                  </div>
                </div>
              ) : (
                installedWallets.map((wallet) => {
                  const isCurrent = connectedWallet === wallet.name;
                  return (
                    <button
                      key={wallet.name}
                      disabled={isConnecting}
                      onClick={() => handleConnect(wallet.name)}
                      className={`group w-full text-left relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-r ${wallet.color} p-4.5 transition-all duration-300 ${wallet.borderColor} ${wallet.glowColor} hover:shadow-xl hover:shadow-cyan-500/5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Beautiful Glowing Logo Token */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold text-lg border border-white/10 ${wallet.logoColor} shadow-md`}>
                            {wallet.logoText}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs tracking-wider uppercase text-white group-hover:text-cyan-300 transition-colors">
                                {wallet.name}
                              </span>
                              {isCurrent && (
                                <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-lg animate-pulse">
                                  <Check className="w-2.5 h-2.5" /> ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 font-semibold uppercase mt-1 leading-none tracking-wide">{wallet.desc}</p>
                          </div>
                        </div>
                        
                        <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:border-cyan-500/30 group-hover:bg-cyan-500/10 transition-all shadow-inner">
                          {isConnecting && connectingWallet === wallet.name ? (
                            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Error advisories */}
            <div className="mt-4.5 relative z-10">
              {missingWallet && (
                <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-center animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wide">
                    {missingWallet} extension not detected
                  </p>
                  <a
                    href={
                      missingWallet === "Lace" ? "https://www.lace.io/" :
                      missingWallet === "Eternl" ? "https://eternl.io/" :
                      "https://namiwallet.io/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Install {missingWallet} extension
                  </a>
                </div>
              )}
              
              {errorMsg && (
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center animate-in fade-in slide-in-from-bottom-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">{errorMsg}</p>
                </div>
              )}
            </div>

            {/* Footer advisories */}
            <p className="text-[9px] text-center text-gray-600 font-mono tracking-wide mt-6 leading-relaxed">
              By mounting a cryptonode, you authorize natural speech transaction blueprints. Action execution requires signing securely inside preprod network vaults.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
