/**
 * txHistoryService.js
 *
 * MongoDB-backed transaction history store.
 * Records are scoped per walletAddress + blockchain + network.
 */

import TxHistory from "../models/TxHistory.js";
import { isDBConnected } from "../config/db.js";

const normalize = (s = "") => String(s).trim().toLowerCase();

/**
 * Get all transaction history records for a wallet+chain+network.
 * Returns newest first.
 */
export const getTxHistory = async (walletAddress, blockchain, network) => {
  if (!isDBConnected()) return [];
  const docs = await TxHistory.find({
    walletAddress: normalize(walletAddress || "anonymous"),
    blockchain: normalize(blockchain || "cardano"),
    network: normalize(network || "preprod"),
  }).sort({ submittedAt: -1 });

  return docs.map(docToRecord);
};

/**
 * Save a new transaction record.
 * Uses txId as the unique key — safe to call multiple times (upsert).
 */
export const saveTxRecord = async (walletAddress, blockchain, network, record) => {
  if (!isDBConnected()) return record;

  const filter = {
    walletAddress: normalize(walletAddress || "anonymous"),
    txId: record.id || record.txId || `tx-${Date.now()}`,
  };

  const update = {
    walletAddress: normalize(walletAddress || "anonymous"),
    blockchain: normalize(blockchain || "cardano"),
    network: normalize(network || "preprod"),
    txId: record.id || record.txId || `tx-${Date.now()}`,
    txHash: record.txHash || "",
    explorerUrl: record.explorerUrl || "",
    type: record.type || "transfer",
    amount: record.amount || 0,
    assetName: record.assetName || "ADA",
    recipient: record.recipient || "",
    recipientName: record.recipientName || "",
    recipientAddress: record.recipientAddress || "",
    status: record.status || "success",
    fee: record.fee || 0,
    riskLevel: record.riskLevel || "low",
    confidence: record.confidence ?? null,
    submittedAt: record.timestamp ? new Date(record.timestamp) : new Date(),
  };

  const doc = await TxHistory.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  return docToRecord(doc);
};

/**
 * Clear all transaction history for a wallet+chain+network.
 */
export const clearTxHistory = async (walletAddress, blockchain, network) => {
  if (!isDBConnected()) return 0;
  const result = await TxHistory.deleteMany({
    walletAddress: normalize(walletAddress || "anonymous"),
    blockchain: normalize(blockchain || "cardano"),
    network: normalize(network || "preprod"),
  });
  return result.deletedCount;
};

// ── Helper ────────────────────────────────────────────────────────────────────

const docToRecord = (doc) => ({
  id: doc.txId,
  txHash: doc.txHash,
  explorerUrl: doc.explorerUrl,
  type: doc.type,
  amount: doc.amount,
  assetName: doc.assetName,
  recipient: doc.recipient,
  recipientName: doc.recipientName,
  recipientAddress: doc.recipientAddress,
  status: doc.status,
  fee: doc.fee,
  riskLevel: doc.riskLevel,
  confidence: doc.confidence,
  timestamp: doc.submittedAt,
  date:
    doc.submittedAt
      ? new Date(doc.submittedAt).toLocaleDateString([], { month: "short", day: "numeric" }) +
        " " +
        new Date(doc.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "",
  network: doc.network,
  blockchain: doc.blockchain,
});
