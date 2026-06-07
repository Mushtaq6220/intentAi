"use client";

import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import React from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/config/wagmi";
import { BlockchainProvider } from "@/context/BlockchainContext";
import { WalletProvider } from "@/context/WalletContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { DashboardProvider } from "@/context/DashboardContext";

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider theme={darkTheme()}>
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
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}

