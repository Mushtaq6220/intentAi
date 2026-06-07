import mongoose from "mongoose";

/**
 * ChatSession — stores a complete AI chat session including all messages.
 * Scoped per walletAddress + blockchain + network combination.
 */
const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    sender: { type: String, enum: ["user", "ai"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: { type: String },         // "preview", undefined, etc.
    txId: { type: String },           // linked transaction intent ID
    intentData: { type: mongoose.Schema.Types.Mixed }, // full AI parse result
    swapPreview: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false } // messages don't need their own _id (they have id field)
);

const chatSessionSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    blockchain: {
      type: String,
      required: true,
      default: "cardano",
      lowercase: true,
    },
    network: {
      type: String,
      required: true,
      default: "preprod",
      lowercase: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      default: "New Chat",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One session doc per walletAddress + sessionId combo
chatSessionSchema.index(
  { walletAddress: 1, sessionId: 1 },
  { unique: true }
);
// List sessions efficiently per wallet+chain+network
chatSessionSchema.index({ walletAddress: 1, blockchain: 1, network: 1 });

export default mongoose.model("ChatSession", chatSessionSchema);
