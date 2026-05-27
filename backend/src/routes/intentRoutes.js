import express from "express";
import { handleParseIntent, handleChatConversational } from "../controllers/intentController.js";

const router = express.Router();

// Route to receive natural language prompts and parse them into transaction previews
router.post("/parse", handleParseIntent);

// Route for conversational general chat queries
router.post("/chat", handleChatConversational);

export default router;
