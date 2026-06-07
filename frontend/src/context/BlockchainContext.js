"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const BlockchainContext = createContext(undefined);

export const BlockchainProvider = ({ children }) => {
  const [currentBlockchain, setCurrentBlockchain] = useState("cardano");
  const [isSwitching, setIsSwitching] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedChain = localStorage.getItem("active_blockchain");
      if (savedChain === "cardano" || savedChain === "base") {
        setCurrentBlockchain(savedChain);
      }
      setIsMounted(true);
    }
  }, []);

  const switchBlockchain = (blockchain) => {
    if (blockchain === currentBlockchain) return;
    if (blockchain === "cardano" || blockchain === "base") {
      setIsSwitching(true);
      // Wait for a smooth loading transition before committing the switch and state refresh
      setTimeout(() => {
        setCurrentBlockchain(blockchain);
        if (typeof window !== "undefined") {
          localStorage.setItem("active_blockchain", blockchain);
          
          // Clear network settings to defaults of the new chain
          const defaultNetwork = blockchain === "base" ? "sepolia" : "preprod";
          localStorage.setItem(`${blockchain}_network`, defaultNetwork);
        }
        setIsSwitching(false);
        
        // Force refresh components
        if (typeof window !== "undefined") {
          window.location.reload();
        }
      }, 1500);
    }
  };

  return (
    <BlockchainContext.Provider
      value={{
        currentBlockchain,
        switchBlockchain,
        isSwitching,
        isMounted,
        isCardano: currentBlockchain === "cardano",
        isBase: currentBlockchain === "base"
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => {
  const context = useContext(BlockchainContext);
  if (context === undefined) {
    throw new Error("useBlockchain must be used within a BlockchainProvider");
  }
  return context;
};
