import express from "express";
import {
  handleGetSessions,
  handleUpsertSession,
  handleDeleteSession,
} from "../controllers/sessionController.js";

const router = express.Router();

// GET  /api/sessions          — list all sessions for wallet+chain+network
router.get("/", handleGetSessions);

// POST /api/sessions          — create or update a session
router.post("/", handleUpsertSession);

// DELETE /api/sessions/:sessionId — delete one session
router.delete("/:sessionId", handleDeleteSession);

export default router;
