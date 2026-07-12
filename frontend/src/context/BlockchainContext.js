"use client";

import React, { createContext, useContext } from "react";

const BlockchainContext = createContext(undefined);

export const BlockchainProvider = ({ children }) => {
  return (
    <BlockchainContext.Provider
      value={{
        currentBlockchain: "cardano",
        switchBlockchain: () => {},
        isSwitching: false,
        isMounted: true,
        isCardano: true,
        isBase: false
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
