/**
 * sessionController.js
 *
 * GET    /api/sessions           → list all sessions for wallet+chain+network
 * POST   /api/sessions           → upsert a session
 * DELETE /api/sessions/:sessionId → delete a session
 */

import {
  getSessions,
  upsertSession,
  deleteSession,
} from "../services/sessionService.js";

const getWallet = (req) =>
  (req.headers["x-wallet-address"] || "anonymous").trim().toLowerCase();
const getChain = (req) =>
  (req.headers["x-blockchain"] || "cardano").trim().toLowerCase();
const getNetwork = (req) =>
  (req.headers["x-cardano-network"] || req.headers["x-network"] || "preprod")
    .trim()
    .toLowerCase();

// GET /api/sessions
export const handleGetSessions = async (req, res) => {
  try {
    const sessions = await getSessions(getWallet(req), getChain(req), getNetwork(req));
    return res.status(200).json({ success: true, sessions });
  } catch (err) {
    console.error("[SessionController] GET error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/sessions  (body: { session })
export const handleUpsertSession = async (req, res) => {
  const { session } = req.body;
  if (!session || !session.id) {
    return res.status(400).json({ success: false, error: "session.id is required." });
  }
  try {
    const saved = await upsertSession(
      getWallet(req),
      getChain(req),
      getNetwork(req),
      session
    );
    return res.status(200).json({ success: true, session: saved });
  } catch (err) {
    console.error("[SessionController] POST error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE /api/sessions/:sessionId
export const handleDeleteSession = async (req, res) => {
  const { sessionId } = req.params;
  if (!sessionId) {
    return res.status(400).json({ success: false, error: "sessionId is required." });
  }
  try {
    await deleteSession(getWallet(req), sessionId);
    return res.status(200).json({ success: true, message: "Session deleted." });
  } catch (err) {
    console.error("[SessionController] DELETE error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
