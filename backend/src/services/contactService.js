/**
 * contactService.js
 *
 * MongoDB-backed contact store.
 * Each contact is scoped to a walletAddress (the owner's wallet).
 *
 * Supports both Cardano (addr_test1.../addr1...) and Base (0x...) addresses.
 */

import { bech32 } from "bech32";
import Contact from "../models/Contact.js";
import { isDBConnected } from "../config/db.js";

// ── Address validation ────────────────────────────────────────────────────────

const normalizeAddress = (address = "") => String(address).trim().toLowerCase();

export const isValidCardanoAddress = (address = "") => {
  const norm = normalizeAddress(address);
  if (!norm.startsWith("addr_test1") && !norm.startsWith("addr1")) return false;
  try {
    const decoded = bech32.decode(norm, 1000);
    return decoded.prefix === "addr_test" || decoded.prefix === "addr";
  } catch {
    return false;
  }
};

export const isValidBaseAddress = (address = "") =>
  /^0x[0-9a-fA-F]{40}$/.test(address.trim());

const isValidAddress = (address) =>
  isValidCardanoAddress(address) || isValidBaseAddress(address);

// ── CRUD operations ──────────────────────────────────────────────────────────

/**
 * Get all contacts for a wallet.
 * Falls back gracefully if DB is not connected (returns []).
 */
export const getAllContacts = async (walletAddress) => {
  if (!isDBConnected()) return [];
  const docs = await Contact.find({
    walletAddress: normalizeAddress(walletAddress || "anonymous"),
  }).sort({ createdAt: -1 });
  // Return plain objects shaped like the old JSON format
  return docs.map((d) => ({
    id: d._id.toString(),
    name: d.name,
    address: d.address,
    isFavorite: d.isFavorite,
    avatarColor: d.avatarColor,
    createdAt: d.createdAt,
  }));
};

/**
 * Resolve a contact by name (exact → prefix → partial match).
 */
export const resolveContactByName = async (name, walletAddress) => {
  if (!name || !isDBConnected()) return null;
  const contacts = await getAllContacts(walletAddress);
  const query = name.trim().toLowerCase();
  return (
    contacts.find((c) => c.name.toLowerCase() === query) ||
    contacts.find((c) => c.name.toLowerCase().startsWith(query)) ||
    contacts.find((c) => c.name.toLowerCase().includes(query)) ||
    null
  );
};

/**
 * Add a new contact for a wallet.
 */
export const addContact = async (name, address, walletAddress, isFavorite = false) => {
  if (!name || !address) throw new Error("Name and address are required.");

  const normalizedName = name.trim();
  const normalizedAddress = normalizeAddress(address);
  const ownerWallet = normalizeAddress(walletAddress || "anonymous");

  if (!isValidAddress(normalizedAddress)) {
    throw new Error(
      "Invalid address. Please provide a valid Cardano (addr1.../addr_test1...) or Base (0x...) address."
    );
  }

  if (!isDBConnected()) {
    // Offline fallback: return a temporary contact (won't be persisted)
    return {
      id: `c-${Date.now()}`,
      name: normalizedName,
      address: normalizedAddress,
      isFavorite,
      avatarColor: "bg-pink-500/20 text-pink-400",
      createdAt: new Date().toISOString(),
    };
  }

  // Check for duplicates
  const existing = await Contact.findOne({
    walletAddress: ownerWallet,
    $or: [
      { name: { $regex: new RegExp(`^${normalizedName}$`, "i") } },
      { address: normalizedAddress },
    ],
  });

  if (existing) {
    if (existing.name.toLowerCase() === normalizedName.toLowerCase()) {
      throw new Error(`A contact named "${normalizedName}" already exists.`);
    }
    throw new Error(`This address is already saved for "${existing.name}".`);
  }

  const doc = await Contact.create({
    walletAddress: ownerWallet,
    name: normalizedName,
    address: normalizedAddress,
    isFavorite,
    avatarColor: "bg-pink-500/20 text-pink-400",
  });

  return {
    id: doc._id.toString(),
    name: doc.name,
    address: doc.address,
    isFavorite: doc.isFavorite,
    avatarColor: doc.avatarColor,
    createdAt: doc.createdAt,
  };
};

/**
 * Remove a contact by its ID.
 */
export const removeContact = async (id, walletAddress) => {
  if (!isDBConnected()) return false;
  const result = await Contact.deleteOne({
    _id: id,
    walletAddress: normalizeAddress(walletAddress || "anonymous"),
  });
  return result.deletedCount > 0;
};

/**
 * Toggle the isFavorite flag on a contact.
 */
export const toggleFavorite = async (id, walletAddress) => {
  if (!isDBConnected()) return null;
  const doc = await Contact.findOne({
    _id: id,
    walletAddress: normalizeAddress(walletAddress || "anonymous"),
  });
  if (!doc) return null;
  doc.isFavorite = !doc.isFavorite;
  await doc.save();
  return {
    id: doc._id.toString(),
    name: doc.name,
    address: doc.address,
    isFavorite: doc.isFavorite,
    avatarColor: doc.avatarColor,
    createdAt: doc.createdAt,
  };
};
