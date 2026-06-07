import express from "express";
import {
  handleGetHistory,
  handleSaveRecord,
  handleClearHistory,
} from "../controllers/txHistoryController.js";

const router = express.Router();

// GET    /api/txhistory   — get all records for wallet+chain+network
router.get("/", handleGetHistory);

// POST   /api/txhistory   — save one tx record
router.post("/", handleSaveRecord);

// DELETE /api/txhistory   — clear all history for wallet+chain+network
router.delete("/", handleClearHistory);

export default router;
