import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { bech32 } from "bech32";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");
const CONTACTS_DB = path.join(DATA_DIR, "contacts.json");

const ensureDatabase = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(CONTACTS_DB)) {
    fs.writeFileSync(CONTACTS_DB, JSON.stringify({ contacts: [] }, null, 2));
  }
};

const readDatabase = () => {
  ensureDatabase();
  try {
    const raw = fs.readFileSync(CONTACTS_DB, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.contacts) ? data.contacts : [];
  } catch (error) {
    console.error("[ContactService] Failed to read contacts database:", error);
    return [];
  }
};

const writeDatabase = (contacts) => {
  ensureDatabase();
  fs.writeFileSync(CONTACTS_DB, JSON.stringify({ contacts }, null, 2));
};

const normalizeAddress = (address = "") => String(address).trim().toLowerCase();

export const isValidCardanoAddress = (address = "") => {
  const normalized = normalizeAddress(address);
  if (!normalized.startsWith("addr_test1") && !normalized.startsWith("addr1")) {
    return false;
  }

  try {
    const decoded = bech32.decode(normalized, 1000);
    return decoded.prefix === "addr_test" || decoded.prefix === "addr";
  } catch {
    return false;
  }
};

export const getAllContacts = () =>
  readDatabase().filter((contact) => isValidCardanoAddress(contact.address));

export const resolveContactByName = (name) => {
  if (!name) return null;

  const contacts = getAllContacts();
  const query = name.trim().toLowerCase();

  const exact = contacts.find(c => c.name.toLowerCase() === query);
  if (exact) return exact;

  const partial = contacts.find(c => c.name.toLowerCase().startsWith(query));
  if (partial) return partial;

  return contacts.find(c => c.name.toLowerCase().includes(query)) || null;
};

export const getContactById = (id) =>
  getAllContacts().find(c => c.id === id) || null;

export const addContact = (name, address, isFavorite = false) => {
  if (!name || !address) {
    throw new Error("Name and address are required.");
  }

  const normalizedName = name.trim();
  const normalizedAddress = normalizeAddress(address);

  if (!isValidCardanoAddress(normalizedAddress)) {
    throw new Error("Invalid Cardano address. Save a real addr_test1... preprod/testnet or addr1... mainnet address.");
  }

  const contacts = readDatabase();
  const duplicateName = contacts.find(c => c.name.toLowerCase() === normalizedName.toLowerCase());
  if (duplicateName) {
    throw new Error(`A contact named "${normalizedName}" already exists.`);
  }

  const duplicateAddress = contacts.find(c => normalizeAddress(c.address) === normalizedAddress);
  if (duplicateAddress) {
    throw new Error(`This address is already saved for "${duplicateAddress.name}".`);
  }

  const newContact = {
    id: `c-${Date.now()}`,
    name: normalizedName,
    address: normalizedAddress,
    isFavorite,
    avatarColor: "bg-pink-500/20 text-pink-400",
    createdAt: new Date().toISOString()
  };

  writeDatabase([newContact, ...contacts]);
  return newContact;
};

export const removeContact = (id) => {
  const contacts = readDatabase();
  const nextContacts = contacts.filter(c => c.id !== id);
  if (nextContacts.length === contacts.length) return false;
  writeDatabase(nextContacts);
  return true;
};

export const toggleFavorite = (id) => {
  const contacts = readDatabase();
  const contact = contacts.find(c => c.id === id);
  if (!contact) return null;

  contact.isFavorite = !contact.isFavorite;
  writeDatabase(contacts);
  return contact;
};
