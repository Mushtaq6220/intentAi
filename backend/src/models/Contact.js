import mongoose from "mongoose";

/**
 * Contact — represents an address book entry.
 * Scoped per walletAddress (the owner's wallet).
 * Supports both Cardano (addr1.../addr_test1...) and Base (0x...) addresses.
 */
const contactSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      required: true,
      index: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    avatarColor: {
      type: String,
      default: "bg-pink-500/20 text-pink-400",
    },
  },
  {
    timestamps: true, // createdAt + updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique contact name per wallet
contactSchema.index({ walletAddress: 1, name: 1 }, { unique: true });
// Unique address per wallet
contactSchema.index({ walletAddress: 1, address: 1 }, { unique: true });

export default mongoose.model("Contact", contactSchema);
