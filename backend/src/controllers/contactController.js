/**
 * contactController.js  (MongoDB version)
 *
 * GET    /api/contacts
 * POST   /api/contacts
 * DELETE /api/contacts/:id
 * PATCH  /api/contacts/:id/favorite
 *
 * The caller's wallet address is read from the X-Wallet-Address header.
 * If not provided, contacts are stored under the "anonymous" bucket.
 */

import {
  getAllContacts,
  addContact,
  removeContact,
  toggleFavorite,
} from "../services/contactService.js";

const getWallet = (req) =>
  (req.headers["x-wallet-address"] || "anonymous").trim().toLowerCase();

// GET /api/contacts
export const handleGetContacts = async (req, res) => {
  try {
    const contacts = await getAllContacts(getWallet(req));
    return res.status(200).json({ success: true, contacts });
  } catch (err) {
    console.error("[ContactController] GET error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/contacts
export const handleAddContact = async (req, res) => {
  const { name, address, isFavorite } = req.body;
  if (!name || !address) {
    return res
      .status(400)
      .json({ success: false, error: "Both 'name' and 'address' fields are required." });
  }
  try {
    const contact = await addContact(name, address, getWallet(req), isFavorite ?? false);
    return res.status(201).json({
      success: true,
      contact,
      message: `Contact "${name}" added successfully.`,
    });
  } catch (err) {
    console.error("[ContactController] POST error:", err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE /api/contacts/:id
export const handleRemoveContact = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ success: false, error: "Contact ID is required." });
  try {
    const removed = await removeContact(id, getWallet(req));
    if (!removed) {
      return res.status(404).json({ success: false, error: `Contact "${id}" not found.` });
    }
    return res.status(200).json({ success: true, message: "Contact removed successfully." });
  } catch (err) {
    console.error("[ContactController] DELETE error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// PATCH /api/contacts/:id/favorite
export const handleToggleFavorite = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await toggleFavorite(id, getWallet(req));
    if (!updated) {
      return res.status(404).json({ success: false, error: `Contact "${id}" not found.` });
    }
    return res.status(200).json({ success: true, contact: updated });
  } catch (err) {
    console.error("[ContactController] PATCH error:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};
