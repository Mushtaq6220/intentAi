"use client";
import { ContactsPanel } from "@/components/dashboard/ContactsPanel";
import { useDashboard } from "@/context/DashboardContext";

export default function ContactsPage() {
  const { contacts, handleAddContact, handleRemoveContact, handleToggleFavorite, handleSendAda, handleRequestPayment } = useDashboard();
  return (
    <ContactsPanel
      contacts={contacts}
      onAddContact={handleAddContact}
      onRemoveContact={handleRemoveContact}
      onToggleFavorite={handleToggleFavorite}
      onSendAda={handleSendAda}
      onRequestPayment={handleRequestPayment}
    />
  );
}
