"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const NetworkContext = createContext(undefined);

const networkConfig = {
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
};

export const NetworkProvider = ({ children }) => {
  const [activeNetwork, setActiveNetwork] = useState("preprod");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedNetwork = localStorage.getItem("cardano_network");
    if (savedNetwork === "mainnet" || savedNetwork === "preprod") {
      setActiveNetwork(savedNetwork);
    }
    setIsMounted(true);
  }, []);

  const changeNetwork = (network) => {
    if (network === "mainnet" || network === "preprod") {
      setActiveNetwork(network);
      localStorage.setItem("cardano_network", network);
      console.log(`[NetworkContext] Platform network switched to: ${network}`);
    }
  };

  // Prevent SSR mismatch issues by ensuring context resolves defaults on server and mounts cleanly on client
  const config = networkConfig[activeNetwork];

  return (
    <NetworkContext.Provider
      value={{
        activeNetwork,
        setNetwork: changeNetwork,
        isMainnet: activeNetwork === "mainnet",
        isPreprod: activeNetwork === "preprod",
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
