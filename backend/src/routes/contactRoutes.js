import express from "express";
import {
  handleGetContacts,
  handleAddContact,
  handleRemoveContact,
  handleToggleFavorite
} from "../controllers/contactController.js";

const router = express.Router();

// GET /api/contacts — List all contacts (used by frontend to load the panel)
router.get("/", handleGetContacts);

// POST /api/contacts — Add a new contact
router.post("/", handleAddContact);

// DELETE /api/contacts/:id — Remove a contact by ID
router.delete("/:id", handleRemoveContact);

// PATCH /api/contacts/:id/favorite — Toggle favorite status
router.patch("/:id/favorite", handleToggleFavorite);

export default router;
