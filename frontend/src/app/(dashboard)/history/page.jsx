"use client";
import React from "react";
import { TxHistory } from "@/components/dashboard/TxHistory";
import { useDashboard } from "@/context/DashboardContext";

export default function HistoryPage() {
  const { pastTransactions } = useDashboard();
  
  return <TxHistory pastTransactions={pastTransactions} />;
}
