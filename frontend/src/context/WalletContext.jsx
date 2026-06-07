"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { BrowserWallet } from "@meshsdk/core";
import { useNetwork } from "@/context/NetworkContext";
import { useBlockchain } from "@/context/BlockchainContext";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";

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
  const { currentBlockchain, isCardano, isBase } = useBlockchain();

  // Cardano specific states
  const [isCardanoConnected, setIsCardanoConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState(null);
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [connectedWalletId, setConnectedWalletId] = useState(null);
  const [cardanoAddress, setCardanoAddress] = useState(null);
  const [adaBalance, setAdaBalance] = useState(null);
  const [meshWallet, setMeshWallet] = useState(null);
  const [walletNetworkId, setWalletNetworkId] = useState(null);

  // Base specific states using Wagmi Hooks
  const { address: evmAddress, isConnected: isEvmConnected } = useAccount();
  const { disconnect: disconnectEvm } = useDisconnect();
  const { connectAsync: connectEvmAsync, connectors: evmConnectors } = useConnect();
  
  const { data: evmBalanceData } = useBalance({
    address: evmAddress,
    query: {
      enabled: isBase && !!evmAddress,
    }
  });

  const evmBalance = evmBalanceData ? parseFloat(evmBalanceData.formatted) : 0;

  const refreshBalance = useCallback(async (walletOverride = null) => {
    if (isBase) return evmBalance;
    const activeWallet = walletOverride || meshWallet;
    if (!activeWallet) return null;
    return refreshWalletBalance(activeWallet, setAdaBalance);
  }, [meshWallet, isBase, evmBalance]);

  // Cardano polling balance
  const pollingRef = useRef(null);
  useEffect(() => {
    if (meshWallet && isCardano) {
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
  }, [meshWallet, isCardano]);

  // Cardano wallet network ID tracking
  useEffect(() => {
    const updateNetworkId = async () => {
      if (meshWallet && isCardano) {
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
  }, [meshWallet, activeNetwork, isCardano]);

  // Cardano silent reconnect
  useEffect(() => {
    const checkPersistedWallet = async () => {
      const savedWallet = localStorage.getItem("connected_wallet");
      const savedWalletId = localStorage.getItem("connected_wallet_id");
      const savedAddress = localStorage.getItem("connected_wallet_address");
      if (savedWallet && isCardano) {
        setConnectedWallet(savedWallet);
        setConnectedWalletId(savedWalletId);
        if (savedAddress) {
          setCardanoAddress(savedAddress);
          setIsCardanoConnected(true);
        }

        try {
          const walletId = getPreferredWalletId(savedWallet, savedWalletId);
          if (walletId) {
             if (savedWallet === "WalletConnect") {
               const adalib = await import("@dcspark/adalib");
               const activeNetwork = localStorage.getItem("cardano_network") || "preprod";
               await initAdalib(activeNetwork);
               
               const connector = adalib.getActiveConnector();
               const provider = await connector.getProvider();
               if (!provider || !provider.session) {
                 localStorage.removeItem("connected_wallet");
                 localStorage.removeItem("connected_wallet_id");
                 localStorage.removeItem("connected_wallet_address");
                 setIsCardanoConnected(false);
                 setConnectedWallet(null);
                 setConnectedWalletId(null);
                 setCardanoAddress(null);
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
             
             setIsCardanoConnected(true);
             setConnectedWallet(savedWallet);
             setConnectedWalletId(walletId);
             setCardanoAddress(address);
             setMeshWallet(wallet);
             localStorage.setItem("connected_wallet_address", address);
             refreshWalletBalance(wallet, setAdaBalance);
          } else {
             setIsCardanoConnected(false);
          }
        } catch (err) {
           console.log("Silent reconnection failed", err);
           setMeshWallet(null);
        }
      }
    };
    
    checkPersistedWallet();
  }, [isCardano]);

  const connectWallet = async (walletName) => {
    setIsConnecting(true);
    setConnectingWallet(walletName);
    
    try {
      if (isBase) {
        const connector = evmConnectors.find(
          c => c.name.toLowerCase().includes(walletName.toLowerCase()) || 
               c.id.toLowerCase().includes(walletName.toLowerCase())
        ) || evmConnectors[0];

        if (!connector) throw new Error("No EVM connectors found.");
        await connectEvmAsync({ connector });
        return true;
      }

      // Cardano Wallet Connection Flow
      const walletId = getPreferredWalletId(walletName);
      if (!walletId) {
        throw new Error(`NOT_INSTALLED`);
      }

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
      
      setIsCardanoConnected(true);
      setConnectedWallet(walletName);
      setConnectedWalletId(walletId);
      setCardanoAddress(address);
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
    if (isBase) {
      disconnectEvm();
      return;
    }

    if (connectedWallet === "WalletConnect") {
      import("@dcspark/adalib").then((adalib) => {
        try {
          adalib.disconnect();
        } catch (e) {
          console.warn("WalletConnect disconnect failed:", e);
        }
      });
    }
    setIsCardanoConnected(false);
    setConnectedWallet(null);
    setConnectedWalletId(null);
    setCardanoAddress(null);
    setAdaBalance(null);
    setMeshWallet(null);
    localStorage.removeItem("connected_wallet");
    localStorage.removeItem("connected_wallet_id");
    localStorage.removeItem("connected_wallet_address");
  };

  // Resolve properties dynamically depending on the active blockchain
  const isConnected = isBase ? isEvmConnected : isCardanoConnected;
  const walletAddress = isBase ? evmAddress : cardanoAddress;
  const balance = isBase ? evmBalance : adaBalance;

  const expectedNetworkId = activeNetwork === "mainnet" ? 1 : 0;
  const isWalletNetworkCorrect = isBase ? true : (!isConnected || walletNetworkId === null || walletNetworkId === expectedNetworkId);

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        isConnecting,
        connectingWallet,
        connectedWallet: isBase ? (isEvmConnected ? "MetaMask" : null) : connectedWallet,
        connectedWalletId,
        walletAddress,
        adaBalance: balance, // keep naming consistent for dashboard
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
