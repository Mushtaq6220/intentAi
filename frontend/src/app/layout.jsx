import "./globals.css";
import { WalletProvider } from "@/context/WalletContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NetworkProvider } from "@/context/NetworkContext";
import { DashboardProvider } from "@/context/DashboardContext";

export const metadata = {
  title: "Cardano AI Intent Transaction System",
  description: "Convert natural language intent into executable Cardano blockchain transactions using AI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[var(--background)] text-[var(--foreground)]">
        <ThemeProvider>
          <NetworkProvider>
            <WalletProvider>
              <DashboardProvider>
                {children}
              </DashboardProvider>
            </WalletProvider>
          </NetworkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

