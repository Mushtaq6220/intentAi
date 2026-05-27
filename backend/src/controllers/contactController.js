/**
 * contactController.js
 *
 * Handles all REST API requests for the contacts resource.
 * GET    /api/contacts         → list all contacts
 * POST   /api/contacts         → add a new contact
 * DELETE /api/contacts/:id     → remove a contact by ID
 * PATCH  /api/contacts/:id/favorite → toggle favorite status
 */

import {
  getAllContacts,
  addContact,
  removeContact,
  toggleFavorite
} from "../services/contactService.js";

/**
 * GET /api/contacts
 * Returns all saved contacts
 */
export const handleGetContacts = (req, res) => {
  try {
    const contacts = getAllContacts();
    return res.status(200).json({ success: true, contacts });
  } catch (err) {
    console.error("[ContactController] Failed to get contacts:", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/contacts
 * Body: { name, address, isFavorite? }
 * Adds a new contact to the store
 */
export const handleAddContact = (req, res) => {
  const { name, address, isFavorite } = req.body;

  if (!name || !address) {
    return res.status(400).json({
      success: false,
      error: "Both 'name' and 'address' fields are required."
    });
  }

  try {
    const newContact = addContact(name, address, isFavorite ?? false);
    return res.status(201).json({
      success: true,
      contact: newContact,
      message: `Contact "${name}" added successfully.`
    });
  } catch (err) {
    console.error("[ContactController] Failed to add contact:", err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/contacts/:id
 * Removes a contact by its unique ID
 */
export const handleRemoveContact = (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, error: "Contact ID is required." });
  }

  const removed = removeContact(id);

  if (!removed) {
    return res.status(404).json({
      success: false,
      error: `Contact with ID "${id}" not found.`
    });
  }

  return res.status(200).json({
    success: true,
    message: `Contact removed successfully.`
  });
};

/**
 * PATCH /api/contacts/:id/favorite
 * Toggles the favorite status of a contact
 */
export const handleToggleFavorite = (req, res) => {
  const { id } = req.params;
  const updated = toggleFavorite(id);

  if (!updated) {
    return res.status(404).json({
      success: false,
      error: `Contact with ID "${id}" not found.`
    });
  }

  return res.status(200).json({ success: true, contact: updated });
};
