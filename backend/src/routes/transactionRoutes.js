import express from "express";
import {
  handleCreateTransaction,
  handleBuildSwapTransaction,
  handleBuildPreprodSwapOrder,
  handleBuildMainnetSwapOrder,
  handleSubmitTransaction
} from "../controllers/transactionController.js";

const router = express.Router();

router.post("/create", handleCreateTransaction);
router.post("/swap/build", handleBuildSwapTransaction);
router.post("/swap/build-preprod", handleBuildPreprodSwapOrder);
router.post("/swap/build-mainnet", handleBuildMainnetSwapOrder);
router.post("/submit", handleSubmitTransaction);

export default router;
