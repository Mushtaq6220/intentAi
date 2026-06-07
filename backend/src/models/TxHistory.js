import mongoose from "mongoose";

/**
 * TxHistory — stores a submitted / completed transaction record.
 * Scoped per walletAddress + blockchain + network.
 */
const txHistorySchema = new mongoose.Schema(
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
    // The unique tx record ID (txHash if available, else a generated string)
    txId: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
      default: "",
    },
    explorerUrl: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["transfer", "swap", "recurring", "stake", "unknown"],
      default: "transfer",
    },
    amount: {
      type: Number,
      default: 0,
    },
    assetName: {
      type: String,
      default: "ADA",
    },
    recipient: {
      type: String,
      default: "",
    },
    recipientName: {
      type: String,
      default: "",
    },
    recipientAddress: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success",
    },
    fee: {
      type: Number,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    confidence: {
      type: Number,
      default: null,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// One record per walletAddress + txId
txHistorySchema.index({ walletAddress: 1, txId: 1 }, { unique: true });
// Efficient listing per wallet+chain+network sorted by newest
txHistorySchema.index({ walletAddress: 1, blockchain: 1, network: 1, submittedAt: -1 });

export default mongoose.model("TxHistory", txHistorySchema);
