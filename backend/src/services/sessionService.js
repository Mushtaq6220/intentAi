/**
 * sessionService.js
 *
 * MongoDB-backed chat session persistence.
 * Sessions are scoped per walletAddress + blockchain + network.
 */

import ChatSession from "../models/ChatSession.js";
import { isDBConnected } from "../config/db.js";

const normalize = (s = "") => String(s).trim().toLowerCase();

/**
 * Get all chat sessions for a wallet+chain+network combo.
 * Returns them newest-first.
 */
export const getSessions = async (walletAddress, blockchain, network) => {
  if (!isDBConnected()) return [];
  const docs = await ChatSession.find({
    walletAddress: normalize(walletAddress || "anonymous"),
    blockchain: normalize(blockchain || "cardano"),
    network: normalize(network || "preprod"),
  }).sort({ updatedAt: -1 });

  return docs.map(docToSession);
};

/**
 * Upsert (create or update) a single session.
 * Uses sessionId as the unique key.
 */
export const upsertSession = async (walletAddress, blockchain, network, session) => {
  if (!isDBConnected()) return session;

  const filter = {
    walletAddress: normalize(walletAddress || "anonymous"),
    sessionId: session.id,
  };

  const update = {
    walletAddress: normalize(walletAddress || "anonymous"),
    blockchain: normalize(blockchain || "cardano"),
    network: normalize(network || "preprod"),
    sessionId: session.id,
    title: session.title || "New Chat",
    messages: (session.messages || []).map(msgToDoc),
  };

  const doc = await ChatSession.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });

  return docToSession(doc);
};

/**
 * Delete a single session by its sessionId.
 */
export const deleteSession = async (walletAddress, sessionId) => {
  if (!isDBConnected()) return false;
  const result = await ChatSession.deleteOne({
    walletAddress: normalize(walletAddress || "anonymous"),
    sessionId,
  });
  return result.deletedCount > 0;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const msgToDoc = (m) => ({
  id: m.id,
  sender: m.sender,
  text: m.text,
  timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
  status: m.status,
  txId: m.txId,
  intentData: m.intentData,
  swapPreview: m.swapPreview,
});

const docToSession = (doc) => ({
  id: doc.sessionId,
  title: doc.title,
  messages: (doc.messages || []).map((m) => ({
    id: m.id,
    sender: m.sender,
    text: m.text,
    timestamp: m.timestamp,
    status: m.status,
    txId: m.txId,
    intentData: m.intentData,
    swapPreview: m.swapPreview,
  })),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});
