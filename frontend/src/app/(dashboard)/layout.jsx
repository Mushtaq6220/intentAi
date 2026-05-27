"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@/context/WalletContext";
import { useTheme } from "@/context/ThemeContext";
import { useNetwork } from "@/context/NetworkContext";
import { useDashboard } from "@/context/DashboardContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { NotificationCenter } from "@/components/dashboard/NotificationCenter";
import { WalletModal } from "@/components/wallet/WalletModal";
import { NetworkSwitcher } from "@/components/dashboard/NetworkSwitcher";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, Sun, Moon, Wallet,
  X, ChevronDown, Copy, Check, LogOut, ExternalLink,
  CheckCircle2, AlertTriangle, Terminal,
} from "lucide-react";


export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, connectedWallet, walletAddress, disconnectWallet, adaBalance } = useWallet();
  const { colors, networkName, explorerUrl, isMainnet } = useNetwork();
  const {
    currentTx, handleTxSuccess, handleTxFailure,
    notifications, handleMarkAllAsRead, handleClearAll, handleRemoveNotification,
    messages, toasts, dismissToast, notify,
  } = useDashboard();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);    // mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // desktop collapse
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isChat = pathname === "/chat";

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsWalletDropdownOpen(false);
    notify({ title: "Wallet Disconnected", message: `${connectedWallet} session closed.`, type: "info" });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] relative">
      {/* ── Background Glows ───────────────────────────────────────────── */}
      <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
      <div className={`absolute top-0 right-0 w-[500px] h-[500px] ${isMainnet ? 'bg-rose-500/5' : 'bg-cyan-500/5'} rounded-full blur-[140px] pointer-events-none transition-all duration-500`} />
      <div className={`absolute bottom-0 left-0 w-[500px] h-[500px] ${isMainnet ? 'bg-amber-500/5' : 'bg-purple-500/5'} rounded-full blur-[140px] pointer-events-none transition-all duration-500`} />


      {/* ── Sidebar (desktop) ─────────────────────────────────────────── */}
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onNavigate={(path) => { router.push(path); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
      />

      {/* ── Mobile Sidebar Drawer ─────────────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden"
            >
              <Sidebar
                collapsed={false}
                className="flex w-[280px]"
                onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                onNavigate={(path) => { router.push(path); setIsSidebarOpen(false); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Column ───────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative z-10">

        {/* ── Top Header ──────────────────────────────────────────────── */}
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-black/35 backdrop-blur-xl z-20 select-none">
          {/* Left — mobile hamburger + brand */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white md:hidden transition-all"
            >
              <Menu className="w-5 h-5" />
            </button>
            {isConnected && (
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1.5 text-xs bg-${colors.accent}-500/10 ${colors.primaryAccent} border border-${colors.accent}-500/20 px-3 py-1 rounded-xl font-semibold font-mono uppercase tracking-wider`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.pulseBg} animate-pulse`} />
                  {networkName}
                </span>
                <span className="hidden lg:block text-[11px] text-gray-500 font-mono">
                  {walletAddress?.substring(0, 15)}...{walletAddress?.substring(walletAddress.length - 8)}
                </span>
              </div>
            )}
          </div>

          {/* Right — controls */}
          <div className="flex items-center gap-2.5 md:gap-3.5">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className={`p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-${colors.accent}-500/30 text-gray-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-sm`}
              title="Toggle theme"
            >
              {theme === "dark"
                ? <Sun className="w-5.5 h-5.5 text-amber-400" />
                : <Moon className="w-5.5 h-5.5 text-cyan-400" />}
            </button>

            {/* Notifications */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
              onRemoveNotification={handleRemoveNotification}
            />

            {/* Network Switcher */}
            <NetworkSwitcher />

            {/* Wallet */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setIsWalletDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-3 px-4.5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-${colors.accent}-500/30 text-gray-300 hover:text-white transition-all active:scale-95 select-none cursor-pointer shadow-sm`}
                >
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${colors.brandGradient} flex items-center justify-center font-extrabold text-sm text-white shadow-md`}>
                    {connectedWallet?.charAt(0).toUpperCase() || "W"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs text-white font-bold leading-tight">{connectedWallet}</span>
                    <span className={`text-[10px] font-mono ${colors.primaryAccent} leading-none mt-0.5`}>
                      {walletAddress?.substring(0, 8)}...{walletAddress?.substring(walletAddress.length - 4)}
                    </span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isWalletDropdownOpen ? "rotate-180" : ""}`} />
                </button>


                <AnimatePresence>
                  {isWalletDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsWalletDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute right-0 mt-2.5 w-72 rounded-2xl solid-dropdown p-4 shadow-2xl z-[100] overflow-hidden"
                      >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${colors.accent}-500/10 rounded-full blur-2xl pointer-events-none`} />
                        <div className={`absolute bottom-0 left-0 w-24 h-24 bg-${isMainnet ? 'amber' : 'purple'}-500/10 rounded-full blur-2xl pointer-events-none`} />
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[10px] font-bold text-white uppercase tracking-wider">{connectedWallet} Connected</span>
                            </div>
                            <span className={`text-[9px] ${colors.badge} px-2 py-0.5 rounded font-mono`}>{networkName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase block">Wallet Balance</span>
                            <span className="text-xl font-bold text-white font-mono mt-1 block">
                              {typeof adaBalance === "number" ? adaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "Syncing"}{" "}
                              <span className={`text-xs ${colors.primaryAccent}`}>ADA</span>
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                            <span className="text-[9px] text-gray-500 uppercase block">Receive Address</span>
                            <div className="flex items-center justify-between font-mono text-[9px] text-gray-300">
                              <span className="break-all select-all pr-2 max-w-[200px] truncate">{walletAddress}</span>
                              <button onClick={handleCopyAddress} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          <a
                            href={`${explorerUrl}/address/${walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] text-gray-300 hover:text-white transition-all font-semibold"
                          >
                            <span className="flex items-center gap-2"><ExternalLink className={`w-3.5 h-3.5 ${colors.primaryAccent}`} /> View on Explorer</span>
                            <ExternalLink className="w-3 h-3 text-gray-500" />
                          </a>
                          <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-bold text-[10px] transition-all cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Disconnect Wallet
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={() => setIsConnectModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold text-xs transition-all shadow-lg shadow-cyan-500/10 border border-cyan-400/20 active:scale-[0.98]"
              >
                <Wallet className="w-4 h-4" /> Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* ── Content Row ─────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Page content */}
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.18 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* PreviewPanel permanently removed from chat flow */}
        </div>
      </div>

      {/* ── Toast Notifications ──────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-[70] w-[min(360px,calc(100vw-2rem))] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 280 }}
              className={`pointer-events-auto rounded-xl border p-4 shadow-2xl backdrop-blur-xl ${
                toast.type === "success" ? "toast-solid-success"
                  : toast.type === "warning" ? "toast-solid-warning"
                  : toast.type === "wallet" ? "toast-solid-wallet"
                  : "toast-solid-info"
              }`}
            >
              <div className="flex gap-3">
                <div className="pt-0.5">
                  {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    : toast.type === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400" />
                    : toast.type === "wallet" ? <Wallet className="w-4 h-4 text-cyan-400" />
                    : <Terminal className="w-4 h-4 text-blue-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white">{toast.title}</h4>
                  <p className="text-[11px] text-gray-300 mt-1 leading-relaxed break-words">{toast.message}</p>
                </div>
                <button onClick={() => dismissToast(toast.id)} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Connect Wallet Modal ─────────────────────────────────────── */}
      <WalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
