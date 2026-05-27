"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { BrowserWallet } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";

const WalletContext = createContext(undefined);

const withTimeout = async (promise, ms, message) => {

  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const getPreferredWalletId = (walletName, savedWalletId = null) => {
  const lowerName = walletName.toLowerCase();

  if (savedWalletId) {
    return savedWalletId;
  }

  // Direct injection checks for standard Cardano browser wallet namespaces (especially crucial on mobile Web3 browsers)
  if (typeof window !== "undefined" && window.cardano) {
    if (lowerName === "lace" && window.cardano.lace) return "lace";
    if (lowerName === "yoroi" && window.cardano.yoroi) return "yoroi";
    if (lowerName === "eternl" && window.cardano.eternl) return "eternl";
    if (lowerName === "nami" && window.cardano.nami) return "nami";
    
    // Exact or partial key match in the window.cardano namespace
    const keys = Object.keys(window.cardano);
    const matchedKey = keys.find(k => k.toLowerCase() === lowerName);
    if (matchedKey) return matchedKey;
  }

  const availableWallets = BrowserWallet.getInstalledWallets();
  const matchedWallet = availableWallets.find(w =>
    w.name.toLowerCase() === lowerName ||
    w.id.toLowerCase() === lowerName
  );

  return matchedWallet?.id || null;
};

const readAdaBalance = async (wallet) => {
  const balanceItems = await wallet.getBalance();
  const lovelaceObj = balanceItems.find((b) => b.unit === "lovelace");
  return lovelaceObj ? Number(lovelaceObj.quantity) / 1000000 : 0;
};

const refreshWalletBalance = async (wallet, setAdaBalance) => {
  try {
    const balance = await readAdaBalance(wallet);
    setAdaBalance(balance);
    return balance;
  } catch (err) {
    console.warn("Wallet balance refresh failed", err);
    setAdaBalance(null);
    return null;
  }
};

export const WalletProvider = ({ children }) => {
  const { activeNetwork } = useNetwork();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [connectedWalletId, setConnectedWalletId] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [adaBalance, setAdaBalance] = useState(null);
  const [meshWallet, setMeshWallet] = useState(null);
  const [walletNetworkId, setWalletNetworkId] = useState(null);


  const refreshBalance = useCallback(async (walletOverride = null) => {
    const activeWallet = walletOverride || meshWallet;
    if (!activeWallet) return null;
    return refreshWalletBalance(activeWallet, setAdaBalance);
  }, [meshWallet]);

  // ── Auto-poll balance every 30 s while connected ──────────────────────────
  const pollingRef = useRef(null);
  useEffect(() => {
    if (meshWallet) {
      // Immediate refresh on wallet change/connect
      refreshWalletBalance(meshWallet, setAdaBalance);
      // Start polling
      pollingRef.current = setInterval(() => {
        refreshWalletBalance(meshWallet, setAdaBalance);
      }, 30_000);
    } else {
      // Clear polling when disconnected
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [meshWallet]);

  // ── Track and update wallet network ID dynamically ─────────────────────────
  useEffect(() => {
    const updateNetworkId = async () => {
      if (meshWallet) {
        try {
          const id = await meshWallet.getNetworkId();
          setWalletNetworkId(id);
          console.log(`[WalletContext] Connected wallet network ID: ${id} (${id === 1 ? "Mainnet" : "Testnet"})`);
        } catch (err) {
          console.warn("[WalletContext] Failed to get wallet network ID:", err);
          setWalletNetworkId(null);
        }
      } else {
        setWalletNetworkId(null);
      }
    };
    updateNetworkId();
  }, [meshWallet, activeNetwork]);

  // Attempt to silently reconnect on mount if previously connected
  useEffect(() => {

    const checkPersistedWallet = async () => {
      const savedWallet = localStorage.getItem("connected_wallet");
      const savedWalletId = localStorage.getItem("connected_wallet_id");
      const savedAddress = localStorage.getItem("connected_wallet_address");
      if (savedWallet) {
        setConnectedWallet(savedWallet);
        setConnectedWalletId(savedWalletId);
        if (savedAddress) {
          setWalletAddress(savedAddress);
          setIsConnected(true);
        }

        try {
          const walletId = getPreferredWalletId(savedWallet, savedWalletId);
          
          if (walletId) {
             const wallet = await withTimeout(
               BrowserWallet.enable(walletId),
               15000,
               `${savedWallet} wallet did not respond. Unlock the extension and try again.`
             );
             const address = await wallet.getChangeAddress();
             
             setIsConnected(true);
             setConnectedWallet(savedWallet);
             setConnectedWalletId(walletId);
             setWalletAddress(address);
             setMeshWallet(wallet);
             localStorage.setItem("connected_wallet_address", address);
             refreshWalletBalance(wallet, setAdaBalance);
          } else {
             localStorage.removeItem("connected_wallet");
             localStorage.removeItem("connected_wallet_id");
             localStorage.removeItem("connected_wallet_address");
             setIsConnected(false);
          }
        } catch (err) {
           console.log("Silent reconnection failed", err);
           setMeshWallet(null);
        }
      }
    };
    
    checkPersistedWallet();
  }, []);

  const connectWallet = async (walletName) => {
    setIsConnecting(true);
    setConnectingWallet(walletName);
    setAdaBalance(null);
    
    try {
      const walletId = getPreferredWalletId(walletName);
      
      if (!walletId) {
        throw new Error(`NOT_INSTALLED`);
      }

      console.log(`Requesting connection to ${walletName} using wallet id "${walletId}"...`);
      const wallet = await withTimeout(
        BrowserWallet.enable(walletId),
        15000,
        `${walletName} did not respond. Unlock the extension, approve the popup, and try again.`
      );
      
      const address = await wallet.getChangeAddress();
      
      setIsConnected(true);
      setConnectedWallet(walletName);
      setConnectedWalletId(walletId);
      setWalletAddress(address);
      setMeshWallet(wallet);
      localStorage.setItem("connected_wallet", walletName);
      localStorage.setItem("connected_wallet_id", walletId);
      localStorage.setItem("connected_wallet_address", address);
      refreshWalletBalance(wallet, setAdaBalance);
      
      console.log(`Connected to ${walletName}! Address: ${address.substring(0, 15)}...`);
      
      return true;
    } catch (err) {
      console.error(`Failed to connect to ${walletName}:`, err);
      throw err;
    } finally {
      setIsConnecting(false);
      setConnectingWallet(null);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setConnectedWallet(null);
    setConnectedWalletId(null);
    setWalletAddress(null);
    setAdaBalance(null);
    setMeshWallet(null);
    localStorage.removeItem("connected_wallet");
    localStorage.removeItem("connected_wallet_id");
    localStorage.removeItem("connected_wallet_address");
  };

  const expectedNetworkId = activeNetwork === "mainnet" ? 1 : 0;
  const isWalletNetworkCorrect = !isConnected || walletNetworkId === null || walletNetworkId === expectedNetworkId;

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectingWallet,
        connectedWallet,
        connectedWalletId,
        walletAddress,
        adaBalance,
        meshWallet,
        walletNetworkId,
        isWalletNetworkCorrect,
        expectedNetworkId,
        connectWallet,
        disconnectWallet,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};


export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
