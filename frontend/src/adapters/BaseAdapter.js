import { getBalance, sendTransaction, writeContract } from "@wagmi/core";
import { parseEther, parseUnits } from "viem";

export const BaseAdapter = {
  getExplorerTxUrl: (hash, isMainnet = false) => {
    return isMainnet 
      ? `https://basescan.org/tx/${hash}`
      : `https://sepolia.basescan.org/tx/${hash}`;
  },

  getBalance: async (config, { address, tokenAddress }) => {
    if (!address) return 0;
    try {
      const balance = await getBalance(config, {
        address,
        token: tokenAddress || undefined,
      });
      return Number(balance.formatted);
    } catch (err) {
      console.warn("Failed to get Base balance:", err);
      return 0;
    }
  },

  transfer: async (config, { amount, recipientAddress, tokenAddress, decimals = 18 }) => {
    if (!tokenAddress) {
      const hash = await sendTransaction(config, {
        to: recipientAddress,
        value: parseEther(String(amount)),
      });
      return hash;
    } else {
      const hash = await writeContract(config, {
        address: tokenAddress,
        abi: [
          {
            name: "transfer",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "recipient", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "transfer",
        args: [recipientAddress, parseUnits(String(amount), decimals)],
      });
      return hash;
    }
  },

  swap: async (config, { amount, fromToken, toToken, recipientAddress, activeNetwork }) => {
    console.log(`[BaseAdapter Swap] Swapping ${amount} ${fromToken} -> ${toToken}`);
    
    // We send funds to standard mock swap router address
    const routerAddress = "0x1111111254fb6c44bac0bed2854e76f90643097d";
    
    if (fromToken === "ETH" || !fromToken || fromToken.toLowerCase() === "eth") {
      const hash = await sendTransaction(config, {
        to: routerAddress,
        value: parseEther(String(amount)),
      });
      return hash;
    } else {
      const hash = await writeContract(config, {
        address: fromToken, 
        abi: [
          {
            name: "transfer",
            type: "function",
            stateMutability: "nonpayable",
            inputs: [
              { name: "recipient", type: "address" },
              { name: "amount", type: "uint256" },
            ],
            outputs: [{ name: "", type: "bool" }],
          },
        ],
        functionName: "transfer",
        args: [routerAddress, parseUnits(String(amount), 18)],
      });
      return hash;
    }
  },

  stake: async (config, { poolId, amount }) => {
    const vaultAddress = poolId || "0x5b38da6a701c568545dcfcb03fcb875f56beddc4";
    const hash = await sendTransaction(config, {
      to: vaultAddress,
      value: parseEther(String(amount || 0.1)),
    });
    return hash;
  }
};
