/**
 * contactService.js
 *
 * MongoDB-backed contact store with local file fallback when running in stateless mode.
 * Each contact is scoped to a walletAddress (the owner's wallet).
 *
 * Supports Cardano (addr_test1.../addr1...) addresses.
 */

import { bech32 } from "bech32";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Contact from "../models/Contact.js";
import { isDBConnected } from "../config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONTACTS_FILE = path.join(__dirname, "..", "..", "data", "contacts.json");

const readLocalContacts = () => {
  try {
    if (fs.existsSync(CONTACTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf-8"));
      if (data && Array.isArray(data.contacts)) {
        return data.contacts;
      }
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.error("[ContactService] Failed to read local contacts:", err.message);
  }
  return [];
};

const writeLocalContacts = (contactsArray) => {
  try {
    const dir = path.dirname(CONTACTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = { contacts: contactsArray };
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[ContactService] Failed to write local contacts:", err.message);
  }
};

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

const isValidAddress = (address) =>
  isValidCardanoAddress(address);

// ── CRUD operations ──────────────────────────────────────────────────────────

/**
 * Get all contacts for a wallet.
 * Falls back to local contacts file if DB is not connected.
 */
export const getAllContacts = async (walletAddress) => {
  const owner = normalizeAddress(walletAddress || "anonymous");
  if (!isDBConnected()) {
    const local = readLocalContacts();
    return local
      .filter(c => normalizeAddress(c.walletAddress || "anonymous") === owner)
      .map(c => ({
        id: c.id,
        name: c.name,
        address: c.address,
        isFavorite: Boolean(c.isFavorite),
        avatarColor: c.avatarColor || "bg-pink-500/20 text-pink-400",
        createdAt: c.createdAt,
      }));
  }
  const docs = await Contact.find({
    walletAddress: owner,
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
 * Fully functional in offline/stateless mode as well.
 */
export const resolveContactByName = async (name, walletAddress) => {
  if (!name) return null;
  const contacts = await getAllContacts(walletAddress);
  const query = name.trim().toLowerCase();
  return (
    contacts.find((c) => c.name.toLowerCase() === query) ||
    contacts.find((c) => c.name.toLowerCase().startsWith(query)) ||
    contacts.find((c) => query.startsWith(c.name.toLowerCase())) ||
    contacts.find((c) => c.name.toLowerCase().includes(query)) ||
    contacts.find((c) => query.includes(c.name.toLowerCase())) ||
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
      "Invalid address. Please provide a valid Cardano (addr1.../addr_test1...) address."
    );
  }

  if (!isDBConnected()) {
    const contacts = readLocalContacts();
    
    // Check duplicates
    const duplicate = contacts.find(c => 
      normalizeAddress(c.walletAddress || "anonymous") === ownerWallet &&
      (c.name.toLowerCase() === normalizedName.toLowerCase() || normalizeAddress(c.address) === normalizedAddress)
    );

    if (duplicate) {
      if (duplicate.name.toLowerCase() === normalizedName.toLowerCase()) {
        throw new Error(`A contact named "${normalizedName}" already exists.`);
      }
      throw new Error(`This address is already saved for "${duplicate.name}".`);
    }

    const contact = {
      id: `c-${Date.now()}`,
      walletAddress: ownerWallet,
      name: normalizedName,
      address: normalizedAddress,
      isFavorite,
      avatarColor: "bg-pink-500/20 text-pink-400",
      createdAt: new Date().toISOString(),
    };

    contacts.push(contact);
    writeLocalContacts(contacts);
    return contact;
  }

  // Check for duplicates in DB
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
  const owner = normalizeAddress(walletAddress || "anonymous");
  if (!isDBConnected()) {
    const contacts = readLocalContacts();
    const index = contacts.findIndex(c => c.id === id && normalizeAddress(c.walletAddress || "anonymous") === owner);
    if (index === -1) return false;
    contacts.splice(index, 1);
    writeLocalContacts(contacts);
    return true;
  }
  const result = await Contact.deleteOne({
    _id: id,
    walletAddress: owner,
  });
  return result.deletedCount > 0;
};

/**
 * Toggle the isFavorite flag on a contact.
 */
export const toggleFavorite = async (id, walletAddress) => {
  const owner = normalizeAddress(walletAddress || "anonymous");
  if (!isDBConnected()) {
    const contacts = readLocalContacts();
    const contact = contacts.find(c => c.id === id && normalizeAddress(c.walletAddress || "anonymous") === owner);
    if (!contact) return null;
    contact.isFavorite = !contact.isFavorite;
    writeLocalContacts(contacts);
    return contact;
  }
  const doc = await Contact.findOne({
    _id: id,
    walletAddress: owner,
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
