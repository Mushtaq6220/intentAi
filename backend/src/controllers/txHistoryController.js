/**
 * txHistoryController.js
 *
 * GET    /api/txhistory         → get all tx records for wallet+chain+network
 * POST   /api/txhistory         → save a tx record
 * DELETE /api/txhistory         → clear all history for wallet+chain+network
 */

import {
  getTxHistory,
  saveTxRecord,
  clearTxHistory,
} from "../services/txHistoryService.js";

const getWallet = (req) =>
  (req.headers["x-wallet-address"] || "anonymous").trim().toLowerCase();
const getChain = (req) =>
  (req.headers["x-blockchain"] || "cardano").trim().toLowerCase();
const getNetwork = (req) =>
  (req.headers["x-cardano-network"] || req.headers["x-network"] || "preprod")
    .trim()
    .toLowerCase();

// GET /api/txhistory
export const handleGetHistory = async (req, res) => {
  try {
    const records = await getTxHistory(getWallet(req), getChain(req), getNetwork(req));
    return res.status(200).json({ success: true, records });
  } catch (err) {
    console.error("[TxHistoryController] GET error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/txhistory  (body: { record })
export const handleSaveRecord = async (req, res) => {
  const { record } = req.body;
  if (!record) {
    return res.status(400).json({ success: false, error: "record is required." });
  }
  try {
    const saved = await saveTxRecord(
      getWallet(req),
      getChain(req),
      getNetwork(req),
      record
    );
    return res.status(201).json({ success: true, record: saved });
  } catch (err) {
    console.error("[TxHistoryController] POST error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/txhistory
export const handleClearHistory = async (req, res) => {
  try {
    const count = await clearTxHistory(getWallet(req), getChain(req), getNetwork(req));
    return res.status(200).json({ success: true, deleted: count });
  } catch (err) {
    console.error("[TxHistoryController] DELETE error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
