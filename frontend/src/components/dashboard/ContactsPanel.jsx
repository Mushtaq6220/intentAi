"use client";

import React, { useState } from "react";
import { User, Search, Plus, Trash2, Send, ArrowDownLeft, Star, Heart, Check, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



export const ContactsPanel = ({
  contacts,
  onAddContact,
  onRemoveContact,
  onToggleFavorite,
  onSendAda,
}) => {
  const [networkTab, setNetworkTab] = useState("testnet");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactAddress, setNewContactAddress] = useState("");
  const [validationError, setValidationError] = useState("");
  const [actionSuccess, setActionSuccess] = useState(null);

  const handleAdd = async (e) => {
    e.preventDefault();
    setValidationError("");

    if (!newContactName.trim()) {
      setValidationError("Please enter a name.");
      return;
    }
    if (!newContactAddress.trim().startsWith("addr_test") && !newContactAddress.trim().startsWith("addr1")) {
      setValidationError("Invalid Cardano address prefix. Must start with addr_test or addr1.");
      return;
    }
    if (newContactAddress.trim().length < 25) {
      setValidationError("Address is too short.");
      return;
    }

    try {
      await onAddContact(newContactName.trim(), newContactAddress.trim());
      setNewContactName("");
      setNewContactAddress("");
      setIsAdding(false);
      
      setActionSuccess("Contact added successfully!");
      setTimeout(() => setActionSuccess(null), 2500);
    } catch (error) {
      setValidationError(error?.message || "Failed to save contact.");
    }
  };

  const networkFilteredContacts = contacts.filter((c) => {
    if (networkTab === "mainnet") return c.address.startsWith("addr1");
    if (networkTab === "testnet") return c.address.startsWith("addr_test1");
    return true;
  });

  const filteredContacts = networkFilteredContacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favorites = filteredContacts.filter((c) => c.isFavorite);
  const recents = filteredContacts.filter((c) => !c.isFavorite);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5.5 h-5.5 text-cyan-400" />
            Contacts Directory
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Manage your recipient list and send instant Cardano transactions using AI shortcuts.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs transition-all duration-300 shadow-md shadow-cyan-500/10 active:scale-[0.98]"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? "Cancel" : "Add New Contact"}
        </button>
      </div>

      {/* Success Notification popups */}
      <AnimatePresence>
        {actionSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl flex items-center gap-2 text-xs text-emerald-400 font-medium"
          >
            <Check className="w-4 h-4" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Contact Modal Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAdd}
            className="p-5 rounded-2xl glass-panel border border-white/5 bg-gradient-to-b from-white/5 to-transparent space-y-4 overflow-hidden"
          >
            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">New Contact Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-semibold block">Username / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Brother"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl glass-input text-xs text-white"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] text-gray-400 font-semibold block">Cardano Wallet Address</label>
                <input
                  type="text"
                  placeholder="addr_test1..."
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  className="w-full py-2.5 px-3.5 rounded-xl glass-input text-xs text-white font-mono"
                />
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setValidationError("");
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/15"
              >
                Save Contact
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by username or wallet address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3.5 pl-10 pr-4 rounded-2xl glass-input text-xs text-white placeholder-gray-500"
          />
        </div>
      </div>

      {/* Main Lists Section */}
      <div className="space-y-8">
        {/* Favorites list */}
        {favorites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Favorite Receivers
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {favorites.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl glass-panel border border-white/5 bg-gradient-to-tr from-white/5 to-transparent flex items-center justify-between group hover:border-cyan-500/20 transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white border border-white/10 ${contact.avatarColor}`}>
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">
                          {contact.name}
                        </span>
                        <button
                          onClick={() => onToggleFavorite(contact.id)}
                          className="text-amber-400 hover:text-gray-500 transition-colors"
                          title="Remove from favorites"
                        >
                          <Star className="w-3 h-3 fill-amber-400" />
                        </button>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 truncate max-w-[150px] block mt-0.5">
                        {contact.address}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSendAda(contact.name)}
                      title={`Send ADA to ${contact.name}`}
                      className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 transition-all hover:scale-105 active:scale-95"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveContact(contact.id)}
                      title="Delete contact"
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent contacts list */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-400" />
            Recent & Other Contacts
          </h3>

          <div className="space-y-3">
            {recents.length === 0 && favorites.length === 0 ? (
              <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl">
                <span className="text-xs text-gray-500">No contacts found. Click "Add New Contact" to create one.</span>
              </div>
            ) : recents.length === 0 ? (
              <div className="text-center p-3">
                <span className="text-[10px] text-gray-500">All contacts are favorited</span>
              </div>
            ) : (
              recents.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white border border-white/5 ${contact.avatarColor}`}>
                      {contact.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{contact.name}</span>
                        <button
                          onClick={() => onToggleFavorite(contact.id)}
                          className="text-gray-500 hover:text-amber-400 transition-colors"
                          title="Add to favorites"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-gray-500 truncate max-w-[200px] sm:max-w-sm mt-0.5">
                        {contact.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => onSendAda(contact.name)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-semibold text-[10px] transition-all"
                    >
                      <Send className="w-3 h-3" /> Send
                    </button>
                    <button
                      onClick={() => onRemoveContact(contact.id)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-gray-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
