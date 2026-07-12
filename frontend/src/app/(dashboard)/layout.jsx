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
  CheckCircle2, AlertTriangle, Terminal
} from "lucide-react";

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isConnected, connectedWallet, walletAddress, disconnectWallet, adaBalance } = useWallet();
  const { colors, networkName, explorerUrl } = useNetwork();
  const {
    notifications, handleMarkAllAsRead, handleClearAll, handleRemoveNotification,
    toasts, dismissToast
  } = useDashboard();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);    // mobile drawer
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // desktop collapse
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] relative transition-colors duration-300">
      {/* ── Immersive Spatial Background Elements ───────────────────────── */}
      <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />
      
      {/* Dynamic Animated Ambient Lighting Orbs */}
      <div className="absolute top-10 right-10 w-[550px] h-[550px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none transition-all duration-700" />
      <div className="absolute bottom-10 left-10 w-[550px] h-[550px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none transition-all duration-700" />

      {/* ── Floating Sidebar (Desktop) ─────────────────────────────────── */}
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        onNavigate={(path) => { router.push(path); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
      />

      {/* ── Slide-in Mobile Sidebar Drawer ───────────────────────────────── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-md"
            />
            <motion.div
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed inset-y-0 left-0 z-50 md:hidden flex my-2 ml-2"
            >
              <Sidebar
                collapsed={false}
                className="flex w-[280px] h-[calc(100vh-1.5rem)] rounded-3xl"
                onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
                onNavigate={(path) => { router.push(path); setIsSidebarOpen(false); }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Instrument Pane Column ─────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 h-[calc(100vh-1.5rem)] my-2 mx-2 md:my-3 md:mr-3 md:ml-3 rounded-2xl md:rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] backdrop-blur-2xl overflow-hidden relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300">
        
        {/* Ambient Top Glow inside main pane */}
        <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-[80px] pointer-events-none ${colors.bgGlow}`} />

        {/* ── Cockpit Top Header ───────────────────────────────────────── */}
        <header className="h-16 shrink-0 flex items-center justify-between px-3 sm:px-6 border-b border-white/5 bg-transparent z-[60] select-none relative">
          {/* Left Area — mobile drawer trigger + network state badge */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink-0">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white md:hidden transition-all cursor-pointer shadow-md"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Small Mobile Logo */}
            <div className="md:hidden flex items-center justify-center shrink-0 w-9 h-9 rounded-xl overflow-hidden shadow-md border border-white/10 bg-slate-950">
              <img src="/logo-avatar.png" alt="IntentAi Logo" className="w-7 h-7 object-contain" />
            </div>
            {isConnected ? (
              <div className="flex items-center gap-2.5">
                <span className={`hidden md:flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-1.5 rounded-xl`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${colors.pulseBg} animate-pulse shadow-[0_0_8px_rgba(0,242,254,0.5)]`} />
                  {networkName}
                </span>
                <span className="hidden lg:block text-[9px] text-gray-500 font-mono font-bold tracking-wider">
                  {walletAddress?.substring(0, 15)}...{walletAddress?.substring(walletAddress.length - 8)}
                </span>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">OFFLINE SANDBOX</span>
              </div>
            )}
          </div>

          {/* Right Area — Platform controls Control Center */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3.5 shrink-0">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`hidden sm:flex p-2.5 sm:p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 text-gray-400 hover:text-white transition-all duration-300 active:scale-95 cursor-pointer shadow-md`}
              title="Toggle system theme"
            >
              {theme === "dark"
                ? <Sun className="w-4 h-4 text-amber-400" />
                : <Moon className="w-4 h-4 text-cyan-400" />}
            </button>

            {/* Platform notifications */}
            <NotificationCenter
              notifications={notifications}
              onMarkAllAsRead={handleMarkAllAsRead}
              onClearAll={handleClearAll}
              onRemoveNotification={handleRemoveNotification}
            />

            {/* Network switch protocol */}
            <NetworkSwitcher />

            {/* Wallet Interface dropdown */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setIsWalletDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3.5 py-2 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 text-gray-300 hover:text-white transition-all duration-300 active:scale-95 select-none cursor-pointer shadow-md shrink-0`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${colors.brandGradient} flex items-center justify-center font-extrabold text-xs text-white shadow-md shrink-0`}>
                    {connectedWallet?.charAt(0).toUpperCase() || "W"}
                  </div>
                  <div className="hidden sm:flex flex-col text-left leading-none">
                    <span className="text-[10px] text-white font-extrabold tracking-wider uppercase leading-none">{connectedWallet}</span>
                    <span className={`text-[9px] font-mono font-bold ${colors.primaryAccent} leading-none mt-1`}>
                      {walletAddress?.substring(0, 6)}...{walletAddress?.substring(walletAddress.length - 4)}
                    </span>
                  </div>
                  <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-gray-500 transition-transform duration-250 ${isWalletDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {isWalletDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsWalletDropdownOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        className="absolute right-0 mt-2.5 w-72 rounded-2xl solid-dropdown p-4 shadow-2xl z-[100] border border-white/5 overflow-hidden"
                      >
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${colors.accent}-500/10 rounded-full blur-2xl pointer-events-none`} />
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex items-center justify-between pb-2.5 border-b border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[9px] font-black text-white uppercase tracking-widest">{connectedWallet} ACTIVE</span>
                            </div>
                            <span className={`text-[8px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-lg font-mono font-bold text-gray-300`}>{networkName}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Ledger Balance</span>
                            <span className="text-xl font-black text-white font-mono mt-1.5 block">
                              {typeof adaBalance === "number" ? adaBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "Syncing"}{" "}
                              <span className={`text-xs font-bold ${colors.primaryAccent}`}>ADA</span>
                            </span>
                          </div>
                          
                          <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
                            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Receive Address</span>
                            <div className="flex items-center justify-between font-mono text-[9px] text-gray-300">
                              <span className="break-all select-all pr-2 max-w-[200px] truncate">{walletAddress}</span>
                              <button onClick={handleCopyAddress} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <a
                            href={`${explorerUrl}/address/${walletAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white transition-all"
                          >
                            <span className="flex items-center gap-2"><ExternalLink className={`w-3.5 h-3.5 ${colors.primaryAccent}`} /> Scan Address</span>
                            <ExternalLink className="w-3 h-3 text-gray-500" />
                          </a>

                          <button
                            onClick={handleDisconnect}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Disconnect Session
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
                className="flex items-center justify-center gap-2 px-3 py-2.5 sm:px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-extrabold text-[10px] uppercase tracking-widest transition-all shadow-lg border border-cyan-400/10 active:scale-[0.98] cursor-pointer shrink-0"
                title="Connect Wallet"
              >
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Connect Wallet</span>
              </button>
            )}
          </div>
        </header>

        {/* ── Content View Pane ────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
          <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* ── Toast Notifications overlay ─────────────────────────────── */}
      <div className="fixed top-6 right-6 z-[200] w-[min(360px,calc(100vw-3rem))] space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 280 }}
              className={`pointer-events-auto rounded-2xl border p-4.5 shadow-2xl backdrop-blur-xl ${
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
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">{toast.title}</h4>
                  <p className="text-[10px] text-gray-300 font-medium mt-1 leading-relaxed break-words">{toast.message}</p>
                </div>
                <button onClick={() => dismissToast(toast.id)} className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Connect Wallet Modal overlay ───────────────────────────── */}
      <WalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}
