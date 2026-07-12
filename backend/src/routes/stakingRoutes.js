import express from "express";
import { handleGetStakingPools, handleGetTrendingPools } from "../controllers/stakingController.js";

const router = express.Router();

// GET /api/staking/pools  — all pools for current network
router.get("/pools", handleGetStakingPools);

// GET /api/staking/pools/trending — top 3 trending pools
router.get("/pools/trending", handleGetTrendingPools);

export default router;
