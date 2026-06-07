"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useBlockchain } from "./BlockchainContext";

const NetworkContext = createContext(undefined);

const networkConfig = {
  cardano: {
    preprod: {
      name: "Preprod Testnet",
      explorerUrl: "https://preprod.cardanoscan.io",
      backendNetwork: "preprod",
      colors: {
        accent: "cyan",
        primaryAccent: "text-cyan-400",
        secondaryAccent: "text-purple-400",
        accentBg: "bg-cyan-500/10",
        accentBgHover: "hover:bg-cyan-500/20",
        accentBorder: "border-cyan-500/20",
        accentBorderHover: "hover:border-cyan-400/40",
        accentGlow: "shadow-cyan-500/20",
        brandGradient: "from-cyan-400 via-indigo-500 to-purple-600",
        brandGradientHover: "hover:from-cyan-300 hover:via-indigo-400 hover:to-purple-500",
        cardGradient: "from-cyan-500/20 to-blue-500/10",
        borderCard: "border-cyan-500/30",
        badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
        pulseBg: "bg-cyan-400",
        textAccent: "text-cyan-300",
        bgGlow: "bg-cyan-500/5",
      }
    },
    mainnet: {
      name: "Cardano Mainnet",
      explorerUrl: "https://cardanoscan.io",
      backendNetwork: "mainnet",
      colors: {
        accent: "rose",
        primaryAccent: "text-rose-400",
        secondaryAccent: "text-amber-400",
        accentBg: "bg-rose-500/10",
        accentBgHover: "hover:bg-rose-500/20",
        accentBorder: "border-rose-500/20",
        accentBorderHover: "hover:border-rose-400/40",
        accentGlow: "shadow-rose-500/20",
        brandGradient: "from-rose-500 via-amber-500 to-yellow-600",
        brandGradientHover: "hover:from-rose-400 hover:via-amber-400 hover:to-yellow-500",
        cardGradient: "from-rose-500/20 to-amber-500/10",
        borderCard: "border-rose-500/30",
        badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
        pulseBg: "bg-rose-400",
        textAccent: "text-rose-300",
        bgGlow: "bg-rose-500/5",
      }
    }
  },
  base: {
    sepolia: {
      name: "Base Sepolia",
      explorerUrl: "https://sepolia.basescan.org",
      backendNetwork: "sepolia",
      colors: {
        accent: "blue",
        primaryAccent: "text-blue-400",
        secondaryAccent: "text-cyan-400",
        accentBg: "bg-blue-500/10",
        accentBgHover: "hover:bg-blue-500/20",
        accentBorder: "border-blue-500/20",
        accentBorderHover: "hover:border-blue-400/40",
        accentGlow: "shadow-blue-500/20",
        brandGradient: "from-blue-500 via-indigo-500 to-cyan-500",
        brandGradientHover: "hover:from-blue-400 hover:via-indigo-400 hover:to-cyan-400",
        cardGradient: "from-blue-500/20 to-indigo-500/10",
        borderCard: "border-blue-500/30",
        badge: "bg-blue-500/10 text-blue-300 border-blue-500/20",
        pulseBg: "bg-blue-400",
        textAccent: "text-blue-300",
        bgGlow: "bg-blue-500/5",
      }
    },
    mainnet: {
      name: "Base Mainnet",
      explorerUrl: "https://basescan.org",
      backendNetwork: "mainnet",
      colors: {
        accent: "emerald",
        primaryAccent: "text-emerald-400",
        secondaryAccent: "text-blue-400",
        accentBg: "bg-emerald-500/10",
        accentBgHover: "hover:bg-emerald-500/20",
        accentBorder: "border-emerald-500/20",
        accentBorderHover: "hover:border-emerald-400/40",
        accentGlow: "shadow-emerald-500/20",
        brandGradient: "from-emerald-500 via-teal-500 to-blue-500",
        brandGradientHover: "hover:from-emerald-400 hover:via-teal-400 hover:to-blue-400",
        cardGradient: "from-emerald-500/20 to-teal-500/10",
        borderCard: "border-emerald-500/30",
        badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
        pulseBg: "bg-emerald-400",
        textAccent: "text-emerald-300",
        bgGlow: "bg-emerald-500/5",
      }
    }
  }
};

export const NetworkProvider = ({ children }) => {
  const { currentBlockchain } = useBlockchain();
  const [activeNetwork, setActiveNetwork] = useState("preprod");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const defaultNetwork = currentBlockchain === "base" ? "sepolia" : "preprod";
    const savedNetwork = localStorage.getItem(`${currentBlockchain}_network`);
    if (savedNetwork) {
      setActiveNetwork(savedNetwork);
    } else {
      setActiveNetwork(defaultNetwork);
    }
    setIsMounted(true);
  }, [currentBlockchain]);

  const changeNetwork = (network) => {
    const validNetworks = currentBlockchain === "base" ? ["mainnet", "sepolia"] : ["mainnet", "preprod"];
    if (validNetworks.includes(network)) {
      setActiveNetwork(network);
      localStorage.setItem(`${currentBlockchain}_network`, network);
      console.log(`[NetworkContext] ${currentBlockchain} network switched to: ${network}`);
    }
  };

  const chainConfig = networkConfig[currentBlockchain] || networkConfig.cardano;
  const config = chainConfig[activeNetwork] || Object.values(chainConfig)[0];

  return (
    <NetworkContext.Provider
      value={{
        activeNetwork,
        setNetwork: changeNetwork,
        isMainnet: activeNetwork === "mainnet",
        isPreprod: activeNetwork === "preprod" || activeNetwork === "sepolia",
        networkName: config.name,
        explorerUrl: config.explorerUrl,
        colors: config.colors,
        isMounted,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};
