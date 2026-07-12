"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { BrowserWallet } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";

let isAdalibInitialized = false;

const initAdalib = async (activeNetwork = "preprod") => {
  if (isAdalibInitialized) return;
  const adalib = await import("@dcspark/adalib");
  
  // Patch WalletConnectConnector prototype to restructure requested namespaces.
  if (adalib.WalletConnectConnector && adalib.WalletConnectConnector.prototype) {
    const originalConnect = adalib.WalletConnectConnector.prototype.connect;
    adalib.WalletConnectConnector.prototype.connect = async function () {
      try {
        const provider = await this.getProvider();
        if (provider && !provider._isPatchedForYoroi) {
          provider._isPatchedForYoroi = true;
          const originalProviderConnect = provider.connect.bind(provider);
          provider.connect = async function (opts) {
            if (opts && opts.namespaces && opts.namespaces.cip34) {
              const originalCip34 = opts.namespaces.cip34;
              const requiredMethods = ["cardano_signTx", "cardano_getBalance", "cardano_getChangeAddress"];
              const allMethods = originalCip34.methods || [];
              const reqMethods = allMethods.filter(m => requiredMethods.includes(m));
              const newOpts = {
                ...opts,
                namespaces: {
                  cip34: {
                    chains: originalCip34.chains,
                    methods: reqMethods,
                    events: [],
                    rpcMap: originalCip34.rpcMap
                  }
                },
                optionalNamespaces: {
                  cip34: {
                    chains: originalCip34.chains,
                    methods: allMethods,
                    events: originalCip34.events || ["cardano_onNetworkChange", "cardano_onAccountChange"],
                    rpcMap: originalCip34.rpcMap
                  }
                }
              };
              return originalProviderConnect(newOpts);
            }
            return originalProviderConnect(opts);
          };
        }
      } catch (err) {
        console.warn("[WalletConnect Patch] Failed to apply Yoroi/Eternl compatibility patch:", err);
      }
      return originalConnect.apply(this, arguments);
    };
  }

  const chosenChain = activeNetwork === "mainnet"
    ? adalib.cardanoMainnetWalletConnect()
    : adalib.cardanoPreprodWalletConnect();

  adalib.init(
    () => ({
      connectors: [
        new adalib.WalletConnectConnector({
          relayerRegion: "wss://relay.walletconnect.com",
          metadata: {
            name: "AI Intent Cardano",
            description: "AI-Powered Cardano Financial Operating System",
            url: window.location.origin,
            icons: ["https://cloud.walletconnect.com/favicon.ico"],
          },
          qrcode: true,
        }),
      ],
      connectorName: "walletconnect",
      chosenChain: chosenChain,
    }),
    "796f69f7c96adf708d9710392d168e0e"
  );
  isAdalibInitialized = true;
};

if (typeof window !== "undefined") {
  window.cardano = window.cardano || {};
  if (!window.cardano.walletconnect) {
    window.cardano.walletconnect = {
      name: "WalletConnect",
      icon: "https://cloud.walletconnect.com/favicon.ico",
      apiVersion: "1.0.0",
      enable: async () => {
        const activeNetwork = localStorage.getItem("cardano_network") || "preprod";
        await initAdalib(activeNetwork);
        const adalib = await import("@dcspark/adalib");
        const chosenChain = activeNetwork === "mainnet"
          ? adalib.cardanoMainnetWalletConnect()
          : adalib.cardanoPreprodWalletConnect();
        adalib.switchNetwork(chosenChain);
        await adalib.connect();
        const api = await adalib.getCardanoAPI();
        return api;
      },
    };
  }
}

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
  if (savedWalletId) return savedWalletId;

  if (typeof window !== "undefined" && window.cardano) {
    if (lowerName === "lace" && window.cardano.lace) return "lace";
    if (lowerName === "yoroi" && window.cardano.yoroi) return "yoroi";
    if (lowerName === "eternl" && window.cardano.eternl) return "eternl";
    if (lowerName === "nami" && window.cardano.nami) return "nami";
    const keys = Object.keys(window.cardano);
    const matchedKey = keys.find(k => k.toLowerCase() === lowerName);
    if (matchedKey) return matchedKey;
  }

  const availableWallets = BrowserWallet.getInstalledWallets();
  const matchedWallet = availableWallets.find(w =>
    w.name.toLowerCase() === lowerName || w.id.toLowerCase() === lowerName
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

  // Balance polling
  const pollingRef = useRef(null);
  useEffect(() => {
    if (meshWallet) {
      refreshWalletBalance(meshWallet, setAdaBalance);
      pollingRef.current = setInterval(() => {
        refreshWalletBalance(meshWallet, setAdaBalance);
      }, 30_000);
    } else {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [meshWallet]);

  // Network ID tracking
  useEffect(() => {
    const updateNetworkId = async () => {
      if (meshWallet) {
        try {
          const id = await meshWallet.getNetworkId();
          setWalletNetworkId(id);
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

  // Silent reconnect
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
            if (savedWallet === "WalletConnect") {
              const adalib = await import("@dcspark/adalib");
              const activeNet = localStorage.getItem("cardano_network") || "preprod";
              await initAdalib(activeNet);
              const connector = adalib.getActiveConnector();
              const provider = await connector.getProvider();
              if (!provider || !provider.session) {
                localStorage.removeItem("connected_wallet");
                localStorage.removeItem("connected_wallet_id");
                localStorage.removeItem("connected_wallet_address");
                setIsConnected(false);
                setConnectedWallet(null);
                setConnectedWalletId(null);
                setWalletAddress(null);
                return;
              }
            }
            const connectionResult = await withTimeout(
              (async () => {
                const walletInstance = await BrowserWallet.enable(walletId);
                const changeAddress = await walletInstance.getChangeAddress();
                return { walletInstance, changeAddress };
              })(),
              15000,
              `${savedWallet} wallet did not respond.`
            );
            const { walletInstance: wallet, changeAddress: address } = connectionResult;
            setIsConnected(true);
            setConnectedWallet(savedWallet);
            setConnectedWalletId(walletId);
            setWalletAddress(address);
            setMeshWallet(wallet);
            localStorage.setItem("connected_wallet_address", address);
            refreshWalletBalance(wallet, setAdaBalance);
          } else {
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
    try {
      const walletId = getPreferredWalletId(walletName);
      if (!walletId) throw new Error("NOT_INSTALLED");

      const connectionResult = await withTimeout(
        (async () => {
          const walletInstance = await BrowserWallet.enable(walletId);
          const changeAddress = await walletInstance.getChangeAddress();
          let balance = 0;
          try {
            const balanceItems = await walletInstance.getBalance();
            const lovelaceObj = balanceItems.find((b) => b.unit === "lovelace");
            balance = lovelaceObj ? Number(lovelaceObj.quantity) / 1000000 : 0;
          } catch (e) {
            console.warn("Failed to retrieve balance on connect:", e);
          }
          return { walletInstance, changeAddress, balance };
        })(),
        15000,
        `${walletName} did not respond.`
      );

      const { walletInstance: wallet, changeAddress: address, balance } = connectionResult;
      setIsConnected(true);
      setConnectedWallet(walletName);
      setConnectedWalletId(walletId);
      setWalletAddress(address);
      setMeshWallet(wallet);
      setAdaBalance(balance);
      localStorage.setItem("connected_wallet", walletName);
      localStorage.setItem("connected_wallet_id", walletId);
      localStorage.setItem("connected_wallet_address", address);
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
    if (connectedWallet === "WalletConnect") {
      import("@dcspark/adalib").then((adalib) => {
        try { adalib.disconnect(); } catch (e) { console.warn("WalletConnect disconnect failed:", e); }
      });
    }
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

  const refreshBalance = useCallback(async (walletOverride = null) => {
    const activeWallet = walletOverride || meshWallet;
    if (!activeWallet) return null;
    return refreshWalletBalance(activeWallet, setAdaBalance);
  }, [meshWallet]);

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
        tokenBalances: [],
        fetchTokenBalances: async () => [],
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
