"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { BrowserWallet } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";

let isAdalibInitialized = false;

const initAdalib = async (activeNetwork = "preprod") => {
  if (isAdalibInitialized) return;
  const adalib = await import("@dcspark/adalib");
  
  // Patch WalletConnectConnector prototype to restructure requested namespaces.
  // This is required because Yoroi and Eternl wallets reject connection requests that require
  // custom network change events ('cardano_onNetworkChange', 'cardano_onAccountChange').
  // By moving these events and non-essential methods into optionalNamespaces, the wallets
  // can connect successfully while still allowing the dApp to request them if supported.
  if (adalib.WalletConnectConnector && adalib.WalletConnectConnector.prototype) {
    const originalConnect = adalib.WalletConnectConnector.prototype.connect;
    adalib.WalletConnectConnector.prototype.connect = async function () {
      try {
        const provider = await this.getProvider();
        if (provider && !provider._isPatchedForYoroi) {
          provider._isPatchedForYoroi = true;
          const originalProviderConnect = provider.connect.bind(provider);
          provider.connect = async function (opts) {
            console.log("[WalletConnect Patch] Intercepting connect options:", opts);
            if (opts && opts.namespaces && opts.namespaces.cip34) {
              const originalCip34 = opts.namespaces.cip34;
              
              // Define the bare minimum required methods that every Cardano wallet supports
              const requiredMethods = ["cardano_signTx", "cardano_getBalance", "cardano_getChangeAddress"];
              const allMethods = originalCip34.methods || [];
              const reqMethods = allMethods.filter(m => requiredMethods.includes(m));
              
              const newOpts = {
                ...opts,
                namespaces: {
                  cip34: {
                    chains: originalCip34.chains,
                    methods: reqMethods,
                    events: [], // Keep required events empty to prevent rejection by Yoroi/Eternl
                    rpcMap: originalCip34.rpcMap
                  }
                },
                optionalNamespaces: {
                  cip34: {
                    chains: originalCip34.chains,
                    methods: allMethods, // Include all methods as optional
                    events: originalCip34.events || ["cardano_onNetworkChange", "cardano_onAccountChange"],
                    rpcMap: originalCip34.rpcMap
                  }
                }
              };
              
              console.log("[WalletConnect Patch] Using patched options:", newOpts);
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
        console.log("[WalletConnect] Initializing adalib...");
        const activeNetwork = localStorage.getItem("cardano_network") || "preprod";
        await initAdalib(activeNetwork);
        
        console.log("[WalletConnect] Ensuring network is correct...");
        const adalib = await import("@dcspark/adalib");
        const chosenChain = activeNetwork === "mainnet"
          ? adalib.cardanoMainnetWalletConnect()
          : adalib.cardanoPreprodWalletConnect();
        adalib.switchNetwork(chosenChain);

        console.log("[WalletConnect] Connecting via adalib...");
        await adalib.connect();
        
        console.log("[WalletConnect] Connected successfully, retrieving API...");
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
             if (savedWallet === "WalletConnect") {
               // Lazily load adalib and check if a valid WalletConnect session exists.
               // This prevents the QR code modal from popping up unexpectedly on page refresh.
               const adalib = await import("@dcspark/adalib");
               const activeNetwork = localStorage.getItem("cardano_network") || "preprod";
               await initAdalib(activeNetwork);
               
               const connector = adalib.getActiveConnector();
               const provider = await connector.getProvider();
               if (!provider || !provider.session) {
                 console.log("[WalletContext] WalletConnect session not active, skipping silent reconnect");
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
    if (connectedWallet === "WalletConnect") {
      import("@dcspark/adalib").then((adalib) => {
        try {
          adalib.disconnect();
        } catch (e) {
          console.warn("WalletConnect disconnect failed:", e);
        }
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
