import express from "express";
import multer from "multer";
import { 
  handleParseIntent, 
  handleChatConversational,
  handleSpeechToText
} from "../controllers/intentController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Route to receive natural language prompts and parse them into transaction previews
router.post("/parse", handleParseIntent);

// Route for conversational general chat queries
router.post("/chat", handleChatConversational);

// Route to receive voice recordings and transcribe them using Sarvam AI
router.post("/stt", upload.single("file"), handleSpeechToText);

export default router;
