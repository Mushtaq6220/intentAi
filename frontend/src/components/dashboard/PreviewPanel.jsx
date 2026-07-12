"use client";

import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { ChainFactory } from "@/adapters/ChainFactory";
import { ShieldCheck, Loader2 } from "lucide-react";
import { BrowserWallet } from "@meshsdk/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export const PreviewPanel = ({
  currentTx,
  onTxSuccess,
  onTxFailure,
}) => {
  const { isConnected, connectedWallet, connectedWalletId, adaBalance, meshWallet, refreshBalance } = useWallet();
  const [txState, setTxState] = useState("idle");
  const [txHash, setTxHash] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleExecute = async () => {
    if (!currentTx) return;

    if (!meshWallet && !connectedWallet) {
      console.error("No active Mesh wallet instance found.");
      setErrorMessage("No active Lace/Mesh wallet instance was found.");
      setTxState("error");
      return;
    }

    setTxState("signing");
    setErrorMessage(null);

    try {
      if (currentTx.errors?.length) {
        throw new Error(currentTx.errors.join(" "));
      }

      const adapter = ChainFactory.get();
      let hash = "";

      const activeWallet = connectedWallet
        ? await BrowserWallet.enable(connectedWalletId || connectedWallet.toLowerCase())
        : meshWallet;

      if (!activeWallet) {
        throw new Error("Wallet session is not active. Reconnect Lace and try again.");
      }

      hash = await adapter.transfer(activeWallet, {
        amount: currentTx.amount,
        recipientAddress: currentTx.recipientAddress,
      });

      await fetch(`${API_BASE_URL}/api/transaction/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, blockchain: "cardano" })
      }).catch(() => undefined);

      const activeWalletAfter = connectedWallet
        ? await BrowserWallet.enable(connectedWalletId || connectedWallet.toLowerCase())
        : meshWallet;
      await refreshBalance(activeWalletAfter);

      setTxHash(hash);
      setTxState("success");
      onTxSuccess?.({
        txHash: hash,
        explorerUrl: adapter.getExplorerTxUrl(hash, currentTx.network === "mainnet"),
        submittedAt: new Date(),
      });

    } catch (err) {
      console.error("Transaction execution failed:", err);
      const message = err?.message || "Wallet rejected signing or submission failed.";
      setErrorMessage(message);
      setTxState("error");
      onTxFailure?.(message);
    }
  };

  return (
    <div className="w-80 border-l border-white/5 bg-black/40 backdrop-blur-xl p-6 flex flex-col h-full shrink-0 overflow-hidden">
      {/* Wallet Balance Widget */}
      <div className="mb-6">
        {isConnected ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-cyan-900/10 to-purple-900/10 border border-white/5 relative overflow-hidden">
            {/* Mesh pattern overlay */}
            <div className="absolute inset-0 bg-grid-bg opacity-10" />
            <div className="relative z-10">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                Preprod Portfolio
              </span>
              <span className="text-2xl font-black text-white font-mono mt-1.5 block">
                {typeof adaBalance === "number"
                  ? adaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })
                  : "Syncing"}{" "}
                <span className="text-xs font-bold text-cyan-400">
                  ADA
                </span>
              </span>
              <div className="flex items-center gap-1.5 mt-3 text-[10px] text-gray-400 border-b border-white/5 pb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Testnet Node Live</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center py-6">
            <span className="text-xs text-gray-500 font-medium">Connect wallet to view your balance</span>
          </div>
        )}
      </div>
    </div>
  );
};
