import { BrowserWallet, Transaction } from "@meshsdk/core";

export const CardanoAdapter = {
  getExplorerTxUrl: (hash, isMainnet = false) => {
    return isMainnet 
      ? `https://cardanoscan.io/transaction/${hash}`
      : `https://preprod.cardanoscan.io/transaction/${hash}`;
  },

  connectWallet: async (walletName) => {
    const wallets = BrowserWallet.getInstalledWallets() || [];
    const matched = wallets.find(w => w.name.toLowerCase() === walletName.toLowerCase() || w.id.toLowerCase() === walletName.toLowerCase());
    const id = matched?.id || walletName.toLowerCase();
    const walletInstance = await BrowserWallet.enable(id);
    return walletInstance;
  },

  getBalance: async (walletInstance) => {
    if (!walletInstance) return 0;
    const balanceItems = await walletInstance.getBalance();
    const lovelaceObj = balanceItems.find((b) => b.unit === "lovelace");
    return lovelaceObj ? Number(lovelaceObj.quantity) / 1000000 : 0;
  },

  transfer: async (walletInstance, { amount, recipientAddress }) => {
    if (!walletInstance) throw new Error("Wallet instance is required.");
    const tx = new Transaction({ initiator: walletInstance });
    const lovelaceAmount = Math.floor(amount * 1000000).toString();
    tx.sendLovelace(recipientAddress, lovelaceAmount);
    
    const unsignedTx = await tx.build();
    const signedTx = await walletInstance.signTx(unsignedTx);
    const hash = await walletInstance.submitTx(signedTx);
    return hash;
  },

  swap: async (walletInstance, { amount, fromToken, toToken, recipientAddress, txPlan, activeNetwork, API_BASE_URL }) => {
    if (!walletInstance) throw new Error("Wallet instance is required.");
    
    let usedAggregator = false;
    let txHash = "";

    if (txPlan?.estimatePayload) {
      try {
        const buildResponse = await fetch(`${API_BASE_URL}/api/transaction/swap/build`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: recipientAddress,
            min_amount_out: txPlan.estimatePayload.min_amount_out,
            estimate: txPlan.estimatePayload
          })
        });

        const buildData = await buildResponse.json();
        if (buildResponse.ok && buildData.cbor) {
          const signedTxHex = await walletInstance.signTx(buildData.cbor);
          const submittedHash = await walletInstance.submitTx(signedTxHex);
          txHash = submittedHash;
          usedAggregator = true;
        }
      } catch (aggErr) {
        console.warn("[CardanoAdapter Swap] Aggregator API error:", aggErr.message);
      }
    }

    if (!usedAggregator) {
      let minAmountOut = 1;
      if (txPlan?.estimatePayload?.min_amount_out) {
        const parsed = Math.floor(Number(txPlan.estimatePayload.min_amount_out));
        if (parsed > 0) minAmountOut = parsed;
      } else if (txPlan?.estimatedOutput && Number(txPlan.estimatedOutput) > 0) {
        minAmountOut = Math.floor(Number(txPlan.estimatedOutput) * 1_000_000 * 0.995);
        if (minAmountOut < 1) minAmountOut = 1;
      }

      const endpointUrl = activeNetwork === "mainnet" 
        ? `${API_BASE_URL}/api/transaction/swap/build-mainnet`
        : `${API_BASE_URL}/api/transaction/swap/build-preprod`;

      const orderResponse = await fetch(endpointUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderAddress: recipientAddress,
          fromToken: txPlan?.fromToken || fromToken || "ADA",
          toToken: txPlan?.toToken || toToken || "MIN",
          amount: amount,
          minAmountOut,
        })
      });

      const orderData = await orderResponse.json();
      if (!orderResponse.ok || !orderData.orderAddress) {
        throw new Error(orderData.error || `Failed to build Cardano swap order.`);
      }

      let walletUtxos = [];
      try {
        walletUtxos = await walletInstance.getUtxos();
      } catch (_) {}

      const totalWalletLovelace = walletUtxos.reduce((acc, u) => {
        const lovelace = u?.output?.amount?.find?.(a => a.unit === "lovelace")?.quantity
          || u?.amount?.find?.(a => a.unit === "lovelace")?.quantity
          || "0";
        return acc + BigInt(lovelace);
      }, BigInt(0));

      const requiredLovelace = BigInt(orderData.amountLovelace) + BigInt(1_500_000); 
      if (totalWalletLovelace < requiredLovelace) {
        throw new Error(
          `Insufficient ADA. You need at least ${(Number(requiredLovelace) / 1_000_000).toFixed(2)} ADA ` +
          `(swap + ~4 ADA deposit/batcher + change), but your wallet only has ` +
          `${(Number(totalWalletLovelace) / 1_000_000).toFixed(2)} ADA.`
        );
      }

      if (walletUtxos.length === 1) {
        throw new Error(
          "UTxO Consolidation Required: Your wallet balance is locked in a single UTxO. " +
          "Please first send a small amount of ADA to yourself to split it into multiple UTxOs."
        );
      }

      const amountLov = String(orderData.amountLovelace);
      const tx = new Transaction({ initiator: walletInstance });
      tx.sendLovelace(
        {
          address: orderData.orderAddress,
          datum: {
            value: orderData.datum,
            inline: true
          }
        },
        amountLov
      );

      const unsignedTx = await tx.build();
      const signedTx   = await walletInstance.signTx(unsignedTx);
      txHash            = await walletInstance.submitTx(signedTx);
    }

    return txHash;
  },

  stake: async (walletInstance, { poolId }) => {
    if (!walletInstance) throw new Error("Wallet instance is required.");
    const rewardAddresses = await walletInstance.getRewardAddresses();
    if (!rewardAddresses || rewardAddresses.length === 0) {
      throw new Error("No reward address found in wallet.");
    }
    const rewardAddress = rewardAddresses[0];
    if (!poolId) {
      throw new Error("Pool ID not found or invalid.");
    }

    const tx = new Transaction({ initiator: walletInstance });
    tx.delegateStake(rewardAddress, poolId);

    const unsignedTx = await tx.build();
    const signedTx = await walletInstance.signTx(unsignedTx);
    const hash = await walletInstance.submitTx(signedTx);
    return hash;
  }
};
