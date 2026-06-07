"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useWallet } from "@/context/WalletContext";
import { useNetwork } from "@/context/NetworkContext";
import { useBlockchain } from "@/context/BlockchainContext";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const readApiJson = async (response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `Backend returned ${response.status} ${response.statusText || "non-JSON response"}.`
    );
  }
};

const makeMsgId = (prefix) => `msg-${Date.now()}-${prefix}`;

const createNewSession = (title = "New Chat") => ({
  id:        `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title,
  messages:  [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});


// ── Local sandbox fallback parser ─────────────────────────────────────────────
const KNOWN_TOKENS = ["USDM","DJED","MIN","IUSD","USDA","SHEN","LQ","COPI","SUNDAE","WMT",
  "AGIX","NTX","INDY","IAG","MILK","BOOK","HOSKY","AADA","EMPOWA","CERRA","VYFI","CLAY","PAVIA"];

const localSandboxParse = (text, contactsList, network) => {
  const lower = text.toLowerCase();
  let action = "unknown", amount = 0, token = "ADA", receiverName = null,
    receiverAddress = null, transactionType = "transfer", schedule = null,
    confidence = 92, riskLevel = "low";

  const amountMatch = text.match(/\b\d+(\.\d+)?\b/);
  if (amountMatch) amount = parseFloat(amountMatch[0]);

  const addressMatch = text.match(/addr(?:_test)?1[a-z0-9]+/i);
  if (addressMatch) receiverAddress = addressMatch[0];

  const foundContact = contactsList.find(c => lower.includes(c.name.toLowerCase()));
  if (foundContact) {
    receiverName = foundContact.name;
    receiverAddress = foundContact.address;
  } else {
    const receiverMatch = text.match(/\b(?:to|for)\s+([a-zA-Z][a-zA-Z0-9 _-]{1,40})/i);
    if (receiverMatch && !receiverAddress) receiverName = receiverMatch[1].trim().replace(/[.,!?]+$/, "");
  }

  if (lower.includes("send") || lower.includes("transfer") || lower.includes("pay")) {
    action = "send"; transactionType = "transfer";
  } else if (lower.includes("swap") || lower.includes("exchange") || lower.includes("convert")) {
    action = "swap"; transactionType = "swap"; token = "ADA";
  }

  let fromToken = null, toToken = null;
  if (action === "swap") {
    fromToken = "ADA";
    const detectedTo = KNOWN_TOKENS.find(t => lower.includes(t.toLowerCase()));
    toToken = detectedTo || "USDM";
  }

  if (lower.includes("every friday")) { transactionType = "recurring"; schedule = "every Friday"; }
  else if (lower.includes("every month") || lower.includes("monthly") || lower.includes("recurring")) { transactionType = "recurring"; schedule = "monthly"; }
  else if (lower.includes("tomorrow") || lower.includes("next week") || lower.includes("schedule")) { transactionType = "scheduled"; schedule = "tomorrow"; }

  if (lower.includes("scam") || lower.includes("urgent") || amount > 10000) riskLevel = amount > 10000 ? "medium" : "high";

  const resolvedFromContact = Boolean(foundContact);
  const estimatedFeeAda = transactionType === "swap" ? 0.32 : transactionType === "recurring" ? 0.22 : 0.19;
  const errors = [], warnings = [];
  if (action === "send" && !receiverAddress) errors.push("Recipient contact or address was not found.");

  return {
    intent: { action, amount, token, fromToken, toToken, receiverName, receiverAddress, transactionType, schedule, riskLevel, confidence, safetyWarnings: warnings, safetyErrors: errors },
    transaction: { valid: errors.length === 0, network: network || "preprod", transactionType, action, token, fromToken, toToken, amount, estimatedOutput: action === "swap" ? parseFloat((amount * 0.974).toFixed(4)) : 0, priceImpact: action === "swap" ? 0.05 : 0, slippage: "0.5%", swapFee: action === "swap" ? 0.15 : 0, spotRate: action === "swap" ? 0.98 : 0, receiverName, receiverAddress, resolvedFromContact, estimatedFeeAda, confidence, riskLevel, warnings, errors }
  };
};

const DashboardContext = createContext(undefined);

export const DashboardProvider = ({ children }) => {
  const { isConnected, connectedWallet, walletAddress, disconnectWallet, adaBalance } = useWallet();
  const { activeNetwork, explorerUrl } = useNetwork();
  const { currentBlockchain, isCardano } = useBlockchain();
  const router = useRouter();
  const walletToastRef = useRef(null);
  const currentNetworkRef = useRef(activeNetwork);
  const currentBlockchainRef = useRef(currentBlockchain);

  // ── Chat Session State ───────────────────────────────────────────────────────
  const [chatSessions, setChatSessions]   = useState([]);
  const [activeChatId, setActiveChatId]   = useState(null);
  const [isProcessing, setIsProcessing]   = useState(false);
  const [currentTx, setCurrentTx]         = useState(null);
  const [transactionStates, setTransactionStates] = useState({});
  const [toasts, setToasts]               = useState([]);
  const [contacts, setContacts]           = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pastTransactions, setPastTransactions] = useState([]);
  const [smartRules, setSmartRules]       = useState([
    { id: "rule-1", name: "ADA Price Monitor Swap", condition: "ADA drops below 0.45 USD", action: "Swap 100 ADA for DJED", status: "active" },
    { id: "rule-2", name: "Sponsor Monthly Support", condition: "1st day of month", action: "Send 20 ADA to Brother", status: "paused" },
  ]);

  const getExplorerTxUrl = useCallback((hash) => `${explorerUrl}/transaction/${hash}`, [explorerUrl]);

  // ── Derive messages from active session ────────────────────────────────────
  const activeSession = chatSessions.find(s => s.id === activeChatId);
  const messages = activeSession?.messages || [];

  // ── Network-aware atomic bootstrap and switch mechanism ──────────────────
  useEffect(() => {
    const net = activeNetwork;
    const chain = currentBlockchain;
    const addr = walletAddress || "anonymous";
    console.log(`[DashboardContext] Dynamic network load triggered for: ${chain}:${net} for wallet: ${addr}`);
    
    // Load per-network/chain transactions
    let parsedTx = [];
    if (typeof window !== "undefined") {
      try {
        const savedTx = localStorage.getItem(`${chain}_tx_history_${net}`);
        parsedTx = savedTx ? JSON.parse(savedTx) : [];
      } catch (e) {
        console.warn("Failed to load tx history:", e);
      }
    }
    setPastTransactions(parsedTx);

    // Load per-network/chain chat sessions
    let parsedSessions = [];
    let savedActiveId = null;
    if (typeof window !== "undefined") {
      try {
        const savedSessions = localStorage.getItem(`${chain}_chat_sessions_${net}`);
        parsedSessions = savedSessions ? JSON.parse(savedSessions) : [];
        savedActiveId = localStorage.getItem(`${chain}_active_session_${net}`);
      } catch (e) {
        console.warn("Failed to load sessions:", e);
      }
    }

    if (parsedSessions.length > 0) {
      setChatSessions(parsedSessions);
      const exists = parsedSessions.find(s => s.id === savedActiveId);
      setActiveChatId(exists ? savedActiveId : parsedSessions[0].id);
    } else {
      const fresh = createNewSession();
      setChatSessions([fresh]);
      setActiveChatId(fresh.id);
    }

    // Async sync with MongoDB backend
    const fetchBackendData = async () => {
      try {
        const headers = {
          "X-Wallet-Address": addr,
          "X-Blockchain": chain,
          "X-Cardano-Network": net
        };

        // 1. Fetch Sessions
        const sessRes = await fetch(`${API_BASE_URL}/api/sessions`, { headers });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.success && Array.isArray(sessData.sessions)) {
            const dbSessions = sessData.sessions;
            if (dbSessions.length > 0) {
              setChatSessions(dbSessions);
              const exists = dbSessions.find(s => s.id === savedActiveId);
              setActiveChatId(exists ? savedActiveId : dbSessions[0].id);
              localStorage.setItem(`${chain}_chat_sessions_${net}`, JSON.stringify(dbSessions));
            } else {
              // If backend is empty but localStorage has sessions, sync local sessions to backend
              if (parsedSessions.length > 0) {
                console.log(`[Sync] Syncing ${parsedSessions.length} local sessions to backend...`);
                for (const sess of parsedSessions) {
                  await fetch(`${API_BASE_URL}/api/sessions`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...headers
                    },
                    body: JSON.stringify({ session: sess })
                  }).catch(() => undefined);
                }
              }
            }
          }
        }

        // 2. Fetch Tx History
        const txRes = await fetch(`${API_BASE_URL}/api/txhistory`, { headers });
        if (txRes.ok) {
          const txData = await txRes.json();
          if (txData.success && Array.isArray(txData.records)) {
            const dbTx = txData.records;
            setPastTransactions(dbTx);
            localStorage.setItem(`${chain}_tx_history_${net}`, JSON.stringify(dbTx));
          } else {
            // Sync local tx history to backend if backend is empty
            if (parsedTx.length > 0) {
              console.log(`[Sync] Syncing ${parsedTx.length} local txs to backend...`);
              for (const record of parsedTx) {
                await fetch(`${API_BASE_URL}/api/txhistory`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    ...headers
                  },
                  body: JSON.stringify({ record })
                }).catch(() => undefined);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[DashboardContext] Failed to fetch data from backend, falling back to local:", err.message);
      }
    };

    fetchBackendData();

    // Load transaction states
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem(`${chain}_transaction_states_${net}`) || "{}");
        let changed = false;
        Object.keys(stored).forEach(txId => {
          if (stored[txId].status === "signing" || stored[txId].status === "approved") {
            stored[txId].status = "awaiting_approval";
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(`${chain}_transaction_states_${net}`, JSON.stringify(stored));
        }
        setTransactionStates(stored);
        console.log(`[TX System] Restored transaction states for ${chain}:${net}:`, stored);
      } catch (err) {
        console.error("[TX System] Error parsing transaction states:", err);
        setTransactionStates({});
      }
    }

    currentNetworkRef.current = net;
    currentBlockchainRef.current = chain;
  }, [activeNetwork, currentBlockchain, walletAddress]);

  const updateTxState = useCallback((txId, stateUpdates) => {
    if (!txId) return;
    setTransactionStates(prev => {
      const current = prev[txId] || { status: "awaiting_approval" };
      const nextState = { ...current, ...stateUpdates };
      const nextAll = { ...prev, [txId]: nextState };
      if (typeof window !== "undefined") {
        localStorage.setItem(`${currentBlockchain}_transaction_states_${activeNetwork}`, JSON.stringify(nextAll));
      }
      console.log(`[TX System] Updating transaction ${txId} state to:`, stateUpdates);
      return nextAll;
    });
  }, [activeNetwork, currentBlockchain]);

  // ── Sync states back to localStorage atomic strictly for active network ───
  useEffect(() => {
    if (typeof window !== "undefined" && currentNetworkRef.current === activeNetwork && currentBlockchainRef.current === currentBlockchain) {
      localStorage.setItem(`${currentBlockchain}_tx_history_${activeNetwork}`, JSON.stringify(pastTransactions));
    }
  }, [pastTransactions, activeNetwork, currentBlockchain]);

  useEffect(() => {
    if (typeof window !== "undefined" && chatSessions.length > 0 && currentNetworkRef.current === activeNetwork && currentBlockchainRef.current === currentBlockchain) {
      localStorage.setItem(`${currentBlockchain}_chat_sessions_${activeNetwork}`, JSON.stringify(chatSessions));
    }
  }, [chatSessions, activeNetwork, currentBlockchain]);

  useEffect(() => {
    if (typeof window !== "undefined" && activeChatId && currentNetworkRef.current === activeNetwork && currentBlockchainRef.current === currentBlockchain) {
      localStorage.setItem(`${currentBlockchain}_active_session_${activeNetwork}`, activeChatId);
    }
  }, [activeChatId, activeNetwork, currentBlockchain]);


  useEffect(() => {
    const addr = walletAddress || "anonymous";
    fetch(`${API_BASE_URL}/api/contacts`, {
      headers: {
        "X-Wallet-Address": addr
      }
    })
      .then(readApiJson)
      .then(data => { if (data.success && Array.isArray(data.contacts)) setContacts(data.contacts); })
      .catch(() => undefined);
  }, [walletAddress]);

  useEffect(() => {
    if (isConnected && walletAddress && walletToastRef.current !== walletAddress) {
      walletToastRef.current = walletAddress;
      notify({ title: "Wallet Connected", message: `${connectedWallet || "Wallet"} connected: ${walletAddress.slice(0, 12)}...`, type: "wallet" });
    }
    if (!isConnected) walletToastRef.current = null;
  }, [isConnected, walletAddress, connectedWallet]);

  // Sync a single session to MongoDB Atlas backend
  const syncSessionToBackend = useCallback(async (session) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": walletAddress || "anonymous",
          "X-Blockchain": currentBlockchain,
          "X-Cardano-Network": activeNetwork
        },
        body: JSON.stringify({ session })
      });
      if (!response.ok) {
        console.warn(`[Sync] Failed to sync session ${session.id} to backend`);
      }
    } catch (err) {
      console.warn(`[Sync] Network error syncing session ${session.id}:`, err);
    }
  }, [walletAddress, currentBlockchain, activeNetwork]);

  // ── Session helpers ──────────────────────────────────────────────────────────
  const updateSessionMessages = useCallback((sessionId, updater) => {
    setChatSessions(prev => {
      let targetSession = null;
      const updated = prev.map(s => {
        if (s.id !== sessionId) return s;
        const newMessages = typeof updater === "function" ? updater(s.messages) : updater;
        // Auto-title from first user message
        let title = s.title;
        if (title === "New Chat") {
          const firstUser = newMessages.find(m => m.sender === "user");
          if (firstUser) title = firstUser.text.substring(0, 42) + (firstUser.text.length > 42 ? "…" : "");
        }
        targetSession = { ...s, messages: newMessages, title, updatedAt: new Date().toISOString() };
        return targetSession;
      });

      if (targetSession) {
        setTimeout(() => syncSessionToBackend(targetSession), 0);
      }

      return updated;
    });
  }, [syncSessionToBackend]);

  const handleNewChat = useCallback(() => {
    const fresh = createNewSession();
    setChatSessions(prev => [fresh, ...prev]);
    setActiveChatId(fresh.id);
    setCurrentTx(null);
    router.push("/chat");
    setTimeout(() => syncSessionToBackend(fresh), 0);
  }, [router, syncSessionToBackend]);

  const handleSwitchChat = useCallback((sessionId) => {
    setActiveChatId(sessionId);
    setCurrentTx(null);
    router.push("/chat");
  }, [router]);

  const handleDeleteChat = useCallback((sessionId) => {
    setChatSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (activeChatId === sessionId) {
        if (filtered.length > 0) {
          setActiveChatId(filtered[0].id);
        } else {
          const fresh = createNewSession();
          setActiveChatId(fresh.id);
          setTimeout(() => syncSessionToBackend(fresh), 0);
          return [fresh];
        }
      }
      return filtered;
    });

    fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        "X-Wallet-Address": walletAddress || "anonymous"
      }
    }).catch(err => console.warn(`[Sync] Failed to delete session ${sessionId} on backend:`, err));
  }, [activeChatId, walletAddress, syncSessionToBackend]);

  // Inject an AI message into the active session (used by ChatSection after tx)
  const handleAddAiMessage = useCallback((text) => {
    if (!activeChatId) return;
    const aiMsg = { id: makeMsgId("ai"), sender: "ai", text, timestamp: new Date() };
    updateSessionMessages(activeChatId, prev => [...prev, aiMsg]);
  }, [activeChatId, updateSessionMessages]);

  // ── Notification helpers ─────────────────────────────────────────────────────
  const notify = ({ title, message, type = "info", toast = true }) => {
    const item = { id: `n-${Date.now()}-${Math.random().toString(16).slice(2)}`, title, message, type, timestamp: new Date(), read: false };
    setNotifications(prev => [item, ...prev].slice(0, 30));
    if (toast) {
      setToasts(prev => [item, ...prev].slice(0, 4));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== item.id)), 4500);
    }
    return item;
  };

  const dismissToast           = (id) => setToasts(prev => prev.filter(t => t.id !== id));
  const handleMarkAllAsRead    = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const handleClearAll         = () => setNotifications([]);
  const handleRemoveNotification = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  // ── Contacts ─────────────────────────────────────────────────────────────────
  const handleAddContact = async (name, address) => {
    const response = await fetch(`${API_BASE_URL}/api/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Wallet-Address": walletAddress || "anonymous"
      },
      body: JSON.stringify({ name, address })
    });
    const data = await readApiJson(response);
    if (!response.ok || !data.success || !data.contact) throw new Error(data.error || "Failed to save contact.");
    setContacts(prev => [data.contact, ...prev]);
    notify({ title: "Contact Created", message: `Saved ${name} to your address index.`, type: "info" });
  };
  const handleRemoveContact = (id) => {
    const contact = contacts.find(c => c.id === id);
    setContacts(prev => prev.filter(c => c.id !== id));
    fetch(`${API_BASE_URL}/api/contacts/${id}`, {
      method: "DELETE",
      headers: {
        "X-Wallet-Address": walletAddress || "anonymous"
      }
    }).catch(() => undefined);
    if (contact) notify({ title: "Contact Removed", message: `Deleted ${contact.name}.`, type: "info" });
  };
  const handleToggleFavorite = (id) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
    fetch(`${API_BASE_URL}/api/contacts/${id}/favorite`, {
      method: "PATCH",
      headers: {
        "X-Wallet-Address": walletAddress || "anonymous"
      }
    }).catch(() => undefined);
  };

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const handleSendAda = (name) => { router.push("/chat"); setTimeout(() => handleSendMessage(`Send 10 ADA to ${name}`), 150); };
  const handleRequestPayment = (name) => { router.push("/chat"); setTimeout(() => handleSendMessage(`Request payment: 15 ADA from ${name}`), 150); };

  // ── Transaction handlers ─────────────────────────────────────────────────────
  const handleTxSuccess = (details = {}) => {
    if (currentTx) {
      const submittedAt = details.submittedAt || new Date();
      const txHash = details.txHash || "";
      const isSwap = currentTx.type === "swap";
      const record = {
        id: txHash || `tx-${Date.now()}`,
        txHash,
        explorerUrl: details.explorerUrl || (txHash ? getExplorerTxUrl(txHash) : ""),
        type: currentTx.type,
        amount: currentTx.amount,
        assetName: currentTx.assetName || "ADA",
        recipientName: isSwap ? `DEX Swap (${currentTx.assetName} → ${currentTx.swapToAsset})` : (currentTx.recipientName || ""),
        recipientAddress: currentTx.recipientAddress,
        recipient: isSwap ? `DEX Swap (${currentTx.assetName} → ${currentTx.swapToAsset})` : (currentTx.recipientName || `${currentTx.recipientAddress?.substring(0, 15)}...`),
        status: "success",
        network: currentTx.network || "preprod",
        timestamp: submittedAt.toISOString(),
        date: submittedAt.toLocaleDateString([], { month: "short", day: "numeric" }) + " " + submittedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        fee: currentTx.fee,
        riskLevel: currentTx.riskLevel || "low",
        confidence: currentTx.confidence ?? null,
      };
      setPastTransactions(prev => [record, ...prev]);

      // Sync to backend
      fetch(`${API_BASE_URL}/api/txhistory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Wallet-Address": walletAddress || "anonymous",
          "X-Blockchain": currentBlockchain,
          "X-Cardano-Network": activeNetwork
        },
        body: JSON.stringify({ record })
      }).catch(err => console.warn("[Sync] Failed to sync new transaction to backend:", err));

      const notifyMessage = isSwap
        ? `Swapped ${currentTx.amount} ${currentTx.assetName} to ${currentTx.swapToAsset}${txHash ? ` | ${txHash.slice(0, 10)}...` : ""}`
        : `Sent ${currentTx.amount} ${currentTx.assetName || "ADA"}${txHash ? ` | ${txHash.slice(0, 10)}...` : ""}`;
      notify({ title: isSwap ? "Swap Executed" : "Transaction Success", message: notifyMessage, type: "success" });
    }
  };
  const handleTxFailure = (message) => notify({ title: "Transaction Failed", message, type: "warning" });
  const handleToggleRuleStatus = (id) => {
    setSmartRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === "active" ? "paused" : "active" } : r));
  };

  // ── AI Intent / Send Message ─────────────────────────────────────────────────
  const handleSendMessage = async (text) => {
    // Ensure there's a session to write into
    let currentSessionId = activeChatId;
    if (!currentSessionId) {
      const fresh = createNewSession();
      setChatSessions(prev => [fresh, ...prev]);
      setActiveChatId(fresh.id);
      currentSessionId = fresh.id;
    }

    const userMsg = { id: makeMsgId("user"), sender: "user", text, timestamp: new Date() };
    updateSessionMessages(currentSessionId, prev => [...prev, userMsg]);
    setIsProcessing(true);

    const textLower = text.toLowerCase();
    const isTxAction = /\b(send|swap|stake|pay|transfer|convert|exchange|recurring|delegate)\b/i.test(textLower);

    if (isTxAction) {
      const buildAiText = (intent, txPlan, securityLines) => {
        if (intent.action === "send") {
          const nameText = intent.receiverName ? `**${intent.receiverName}**` : intent.receiverAddress ? `\`${intent.receiverAddress.slice(0, 15)}...\`` : "the recipient";
          let msg = intent.receiverAddress
            ? `I found ${nameText} in your contacts and prepared the transaction. You're about to send **${intent.amount} ${intent.token}** on Cardano Preprod Testnet. Please review the transaction preview before approval.`
            : `I prepared the transfer of **${intent.amount} ${intent.token}** to ${nameText}. Please review the details in the transaction preview panel.`;
          if (securityLines.length) msg += `\n\n⚠️ **Security Advisories:**\n- ${securityLines.join("\n- ")}`;
          return msg;
        }
        if (intent.action === "swap") {
          const fromToken = txPlan?.fromToken || intent.fromToken || "ADA";
          const toToken = txPlan?.toToken || intent.toToken || "USDM";
          const swapAmount = txPlan?.amount || intent.amount || 0;
          const estimated = txPlan?.estimatedOutput || parseFloat((swapAmount * 0.974).toFixed(4));
          let msg = `I prepared your **${fromToken}** → **${toToken}** swap. Based on current pool rates, you'll receive approximately **${estimated} ${toToken}** after dynamic pool fees. Please review and approve the transaction.`;
          if (securityLines.length) msg += `\n\n⚠️ **Security Advisories:**\n- ${securityLines.join("\n- ")}`;
          return msg;
        }
        if (intent.action === "recurring" || intent.transactionType === "recurring") {
          let msg = `I've set up a recurring payment draft — **${intent.amount} ${intent.token}** ${intent.schedule || "monthly"} to **${intent.receiverName || "recipient"}**. Please review the transaction preview. Note: Automated recurring execution requires an active scheduler backend in production.`;
          if (securityLines.length) msg += `\n\n⚠️ **Security Advisories:**\n- ${securityLines.join("\n- ")}`;
          return msg;
        }
        let msg = `I understood your instruction but wasn't able to match it to a blockchain action. Try phrasing it like:\n• "Send 10 ADA to Brother"\n• "Swap 50 ADA to USDM"\n• "Pay 15 ADA monthly to addr_test1..."`;
        if (securityLines.length) msg += `\n\n⚠️ **Safety Alerts:**\n- ${securityLines.join("\n- ")}`;
        return msg;
      };

      const buildDraftedTx = (intent, txPlan) => {
        if (intent.action === "send") {
          return { type: "transfer", recipientName: intent.receiverName, recipientAddress: intent.receiverAddress || "", amount: intent.amount, fee: txPlan?.estimatedFeeAda || 0.19, network: txPlan?.network || "preprod", confidence: intent.confidence, riskLevel: intent.riskLevel, warnings: txPlan?.warnings || [], errors: txPlan?.errors || [], assetName: intent.token };
        }
        if (intent.action === "swap") {
          const fromToken = txPlan?.fromToken || intent.fromToken || "ADA";
          const toToken = txPlan?.toToken || intent.toToken || "USDM";
          const swapAmount = txPlan?.amount || intent.amount || 0;
          const estimatedOutput = txPlan?.estimatedOutput || parseFloat((swapAmount * 0.974).toFixed(4));
          const swapFee = txPlan?.estimatedFeeAda || 0.32;
          return { type: "swap", recipientAddress: txPlan?.receiverAddress || "addr_test1qrm0ec2pvksrq5mw2dx3l376ngr7tsw5p9jel5lhrex4khw9staynmd3jpeh0hvsw5g5478cwrq8uhafpxz5gfc0w3nsv0uka8", amount: swapAmount, fee: swapFee, network: txPlan?.network || "preprod", confidence: txPlan?.confidence || intent.confidence, riskLevel: txPlan?.riskLevel || intent.riskLevel, warnings: txPlan?.warnings || [], errors: txPlan?.errors || [], assetName: fromToken, swapToAsset: toToken, estimatedOutput, priceImpact: txPlan?.priceImpact || 0, slippage: txPlan?.slippage || "0.5%", swapFeeToken: txPlan?.swapFee || 0, spotRate: txPlan?.spotRate || 0 };
        }
        if (intent.action === "recurring" || intent.transactionType === "recurring") {
          return { type: "recurring", recipientName: intent.receiverName, recipientAddress: intent.receiverAddress || "", amount: intent.amount, fee: txPlan?.estimatedFeeAda || 0.22, network: txPlan?.network || "preprod", confidence: intent.confidence, riskLevel: intent.riskLevel, warnings: txPlan?.warnings || [], errors: ["Recurring execution needs a scheduler backend."], assetName: intent.token, frequency: intent.schedule ? (intent.schedule.charAt(0).toUpperCase() + intent.schedule.slice(1)) : "Monthly" };
        }
        return null;
      };

      const buildSwapPreview = (intent, txPlan) => {
        if (intent.action !== "swap") return null;
        const fromToken = txPlan?.fromToken || intent.fromToken || "ADA";
        const toToken = txPlan?.toToken || intent.toToken || "USDM";
        const swapAmount = txPlan?.amount || intent.amount || 0;
        return { action: "swap", fromToken, toToken, amount: swapAmount, estimatedOutput: txPlan?.estimatedOutput || parseFloat((swapAmount * 0.974).toFixed(4)), fee: txPlan?.estimatedFeeAda || 0.32, riskLevel: txPlan?.riskLevel || intent.riskLevel || "low", confidence: txPlan?.confidence || intent.confidence, priceImpact: txPlan?.priceImpact || 0, slippage: txPlan?.slippage || "0.5%", swapFeeToken: txPlan?.swapFee || 0, spotRate: txPlan?.spotRate || 0 };
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/intent/parse`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Cardano-Network": activeNetwork,
            "X-Blockchain": currentBlockchain
          },
          body: JSON.stringify({
            prompt: text,
            senderAddress: walletAddress || undefined,
            balanceAda: adaBalance ?? undefined,
            network: activeNetwork,
            blockchain: currentBlockchain
          })
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await readApiJson(response);
        if (!data.intent) throw new Error("Invalid response schema from parse API");

        const intent = data.intent;
        const txPlan = data.transaction;
        const securityLines = [...(intent.safetyWarnings || []), ...(intent.safetyErrors || [])];
        const aiText = buildAiText(intent, txPlan, securityLines);
        const draftedTx = buildDraftedTx(intent, txPlan);
        const swapPreviewData = buildSwapPreview(intent, txPlan);
        const txId = draftedTx ? `tx_intent_${Date.now()}_${Math.floor(Math.random() * 1000)}` : undefined;
        if (txId) {
          updateTxState(txId, { status: "awaiting_approval" });
          console.log(`[TX System] Created new transaction intent: ${txId} for action: ${intent.action}`);
        }

        const aiMsg = { id: makeMsgId("ai"), sender: "ai", text: aiText, timestamp: new Date(), status: draftedTx ? "preview" : undefined, intentData: data, swapPreview: swapPreviewData || undefined, txId };
        updateSessionMessages(currentSessionId, prev => [...prev, aiMsg]);
        setCurrentTx(draftedTx);
        notify({ title: "Transaction Prepared", message: draftedTx ? `Drafted ${intent.amount} ${intent.token} transaction.` : "Prompt parsed.", type: intent.riskLevel === "high" ? "warning" : "info", toast: intent.riskLevel === "high" || Boolean(draftedTx?.errors?.length) });
      } catch (err) {
        console.warn("Online API failed, using local sandbox:", err.message);
        const data = localSandboxParse(text, contacts, activeNetwork);
        const intent = data.intent;
        const txPlan = data.transaction;
        const securityLines = [...(intent.safetyWarnings || []), ...(intent.safetyErrors || [])];
        const aiText = buildAiText(intent, txPlan, securityLines);
        const draftedTx = buildDraftedTx(intent, txPlan);
        const swapPreviewData = buildSwapPreview(intent, txPlan);
        const txId = draftedTx ? `tx_intent_${Date.now()}_${Math.floor(Math.random() * 1000)}` : undefined;
        if (txId) {
          updateTxState(txId, { status: "awaiting_approval" });
          console.log(`[TX System] Created new transaction intent (offline): ${txId} for action: ${intent.action}`);
        }

        const aiMsg = { id: makeMsgId("ai"), sender: "ai", text: aiText, timestamp: new Date(), status: draftedTx ? "preview" : undefined, intentData: data, swapPreview: swapPreviewData || undefined, txId };
        updateSessionMessages(currentSessionId, prev => [...prev, aiMsg]);
        setCurrentTx(draftedTx);
        notify({ title: "Transaction Prepared (Offline)", message: draftedTx ? `Sandbox drafted ${intent.amount} ${intent.token}.` : "Prompt parsed locally.", type: intent.riskLevel === "high" ? "warning" : "info" });
      } finally {
        setIsProcessing(false);
      }
    } else {
      // ── Conversational path ────────────────────────────────────────────────
      try {
        const response = await fetch(`${API_BASE_URL}/api/intent/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Cardano-Network": activeNetwork,
            "X-Blockchain": currentBlockchain
          },
          body: JSON.stringify({
            prompt: text,
            network: activeNetwork,
            blockchain: currentBlockchain
          })
        });

        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await readApiJson(response);
        const aiMsg = { id: makeMsgId("ai"), sender: "ai", text: data.text || "Hey 👋 How can I help you today?", timestamp: new Date() };
        updateSessionMessages(currentSessionId, prev => [...prev, aiMsg]);
      } catch (err) {
        console.warn("Chat endpoint unreachable, using local fallback:", err.message);
        let responseText = isCardano
          ? "I'm your ADA Intent AI assistant. Try asking me to send, swap, or stake ADA!"
          : "I'm your Base Intent AI assistant. Try asking me to send or swap ETH/ERC20 assets on Base!";
        if (textLower.includes("hi") || textLower.includes("hello") || textLower.includes("hey")) responseText = "Hey 👋 How can I help you today?";
        else if (textLower.includes("how are you")) responseText = `I'm doing great — ready to help with your ${isCardano ? "Cardano" : "Base"} transactions. What would you like to do?`;
        else if (textLower.includes("what can you do") || textLower.includes("help")) responseText = isCardano
          ? "I can help you:\n• 💸 Send ADA to contacts or addresses\n• 🔄 Swap tokens (ADA → USDM, DJED, etc.)\n• 🏦 Stake ADA for passive rewards\n• 📋 View transaction history\n• ⚡ Set up recurring payments\n\nJust type a natural language command like \"Send 10 ADA to Brother\" or \"Swap 50 ADA to HOSKY\" to get started!"
          : "I can help you:\n• 💸 Send ETH or ERC20 tokens to addresses\n• 🔄 Swap ERC20 tokens (ETH → USDC, etc.)\n• 📋 View Base transaction history\n\nJust type a natural language command like \"Send 0.05 ETH to 0x...\" or \"Swap 10 USDC to ETH\"!";
        else if (textLower.includes("thank")) responseText = "You're welcome! Let me know if you need anything else.";
        else if (textLower.includes("balance") || textLower.includes("wallet")) responseText = isConnected ? `Your wallet is connected and ready. Check the wallet button in the top right for your balance.` : "You don't have a wallet connected yet. Click \"Connect Wallet\" in the top right to get started!";
        else responseText = isCardano
          ? "I'm here to help! You can ask me to send ADA, swap tokens, or stake. Type something like \"Send 10 ADA to Brother\"."
          : "I'm here to help! You can ask me to send or swap ETH/ERC20 tokens on Base. Type something like \"Send 0.1 ETH to 0x...\" or \"Swap 10 USDC to ETH\".";
        const aiMsg = { id: makeMsgId("ai"), sender: "ai", text: responseText, timestamp: new Date() };
        updateSessionMessages(currentSessionId, prev => [...prev, aiMsg]);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleApproveSwap = (swapData) => {
    setCurrentTx({ type: "swap", recipientAddress: "DEX preview route", amount: swapData.amount, fee: swapData.fee, network: activeNetwork, confidence: swapData.confidence, riskLevel: swapData.riskLevel, warnings: [], errors: [], assetName: swapData.fromToken, swapToAsset: swapData.toToken, estimatedOutput: swapData.estimatedOutput });
    notify({ title: "Swap Approved", message: `Swapping ${swapData.amount} ${swapData.fromToken} → ${swapData.toToken}. Check the preview panel.`, type: "info" });
  };

  return (
    <DashboardContext.Provider value={{
      // State
      messages, isProcessing, currentTx, setCurrentTx,
      transactionStates, updateTxState,
      toasts, contacts, notifications, pastTransactions, smartRules,
      // Chat sessions
      chatSessions, activeChatId,
      handleNewChat, handleSwitchChat, handleDeleteChat, handleAddAiMessage,
      // Handlers
      handleSendMessage, handleApproveSwap,
      handleTxSuccess, handleTxFailure,
      handleAddContact, handleRemoveContact, handleToggleFavorite,
      handleSendAda, handleRequestPayment,
      handleMarkAllAsRead, handleClearAll, handleRemoveNotification,
      handleToggleRuleStatus,
      dismissToast, notify,
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
};
