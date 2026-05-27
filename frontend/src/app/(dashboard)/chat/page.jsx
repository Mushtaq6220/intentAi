"use client";
import { ChatSection } from "@/components/dashboard/ChatSection";
import { useDashboard } from "@/context/DashboardContext";

export default function ChatPage() {
  const { messages, isProcessing, handleSendMessage, handleApproveSwap } = useDashboard();
  return (
    <ChatSection
      messages={messages}
      onSendMessage={handleSendMessage}
      isProcessing={isProcessing}
      onApproveSwap={handleApproveSwap}
    />
  );
}
