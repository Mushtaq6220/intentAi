"use client";

import "./globals.css";
import React from "react";
import { BlockchainProvider } from "@/context/BlockchainContext";
import { WalletProvider } from "@/context/WalletContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { DashboardProvider } from "@/context/DashboardContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <BlockchainProvider>
          <ThemeProvider>
            <NetworkProvider>
              <WalletProvider>
                <DashboardProvider>
                  {children}
                </DashboardProvider>
              </WalletProvider>
            </NetworkProvider>
          </ThemeProvider>
        </BlockchainProvider>
      </body>
    </html>
  );
}
