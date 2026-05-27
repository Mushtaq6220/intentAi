"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare, History, Bot, TrendingUp, Users,
  ChevronLeft, ChevronRight, Plus, Trash2, MessageCircle, Sparkles, Terminal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";
import { useNetwork } from "@/context/NetworkContext";

const NAV_ITEMS = [
  { path: "/chat",     label: "Chat",               icon: MessageSquare },
  { path: "/stake",    label: "Yield Validator",    icon: TrendingUp },
  { path: "/contacts", label: "Address Book",       icon: Users },
  { path: "/history",  label: "Transaction history", icon: History },
];

const formatSessionDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

export const Sidebar = ({ collapsed, onToggleCollapse, onNavigate, className = "hidden md:flex" }) => {
  const pathname = usePathname();
  const { chatSessions, activeChatId, handleNewChat, handleSwitchChat, handleDeleteChat } = useDashboard();
  const { colors } = useNetwork();
  const [hoveredSession, setHoveredSession] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const onSessionClick = (sessionId) => {
    handleSwitchChat(sessionId);
    onNavigate("/chat");
  };

  const onDelete = (e, sessionId) => {
    e.stopPropagation();
    if (confirmDeleteId === sessionId) {
      handleDeleteChat(sessionId);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(sessionId);
      setTimeout(() => setConfirmDeleteId(null), 2500);
    }
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 88 : 285 }}
      transition={{ type: "spring", damping: 26, stiffness: 220 }}
      className={`relative flex-col h-[calc(100vh-1.5rem)] my-2 ml-2 md:my-3 md:ml-3 rounded-2xl md:rounded-3xl border border-[var(--card-border)] bg-[var(--sidebar-bg)] backdrop-blur-2xl overflow-hidden z-20 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 ${className}`}
    >
      {/* Dynamic Ambient Mesh Glow Overlay */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Brand Header */}
      <div className="px-5 h-16 flex items-center gap-3.5 border-b border-[var(--card-border)] shrink-0 relative z-10">
        <button
          onClick={() => onNavigate("/chat")}
          className="flex items-center gap-3.5 group min-w-0 w-full text-left"
        >
          <div className="w-11 h-11 rounded-2xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-md">
            <img src="/logo-avatar.png" alt="IntentAi Logo" className="w-full h-full object-cover" />
          </div>
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap text-left"
          >
            <h1 className="font-black text-sm tracking-widest text-[var(--foreground)] flex items-center gap-1.5 uppercase leading-none">
              IntentAi <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h1>
          </motion.div>
        </button>
      </div>

      {/* New Conversation Button */}
      <div className="px-4 pt-4.5 pb-2.5 shrink-0 relative z-10">
        <button
          onClick={() => { handleNewChat(); onNavigate("/chat"); }}
          title={collapsed ? "New Terminal Session" : undefined}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 ${colors.textAccent} transition-all duration-300 font-bold text-xs group hover:shadow-lg hover:shadow-cyan-500/5 active:scale-[0.98] cursor-pointer ${collapsed ? "justify-center" : ""}`}
        >
          <Plus className="w-4.5 h-4.5 shrink-0 group-hover:rotate-90 transition-transform duration-300" />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap tracking-wider uppercase text-[10px]"
          >
            New Chat
          </motion.span>
        </button>
      </div>

      {/* Main Navigation Nodes */}
      <nav className="px-4 py-2 space-y-1.5 shrink-0 relative z-10">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path && item.path !== "/chat";
          const isChatActive = pathname === "/chat" && item.path === "/chat";
          const active = isActive || isChatActive;
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 text-xs tracking-wider uppercase font-extrabold group relative ${
                active
                  ? `bg-white/5 border border-white/10 ${colors.textAccent} shadow-lg shadow-black/30`
                  : "text-gray-400 border border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="activeBarIndicator"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${colors.pulseBg}`}
                  transition={{ type: "spring", damping: 15, stiffness: 200 }}
                />
              )}
              <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors duration-300 ${active ? colors.textAccent : "text-gray-500 group-hover:text-white"}`} />
              <motion.span
                animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap text-left"
              >
                {item.label}
              </motion.span>
            </button>
          );
        })}
      </nav>

      {/* Chat Session Registry */}
      <AnimatePresence>
        {!collapsed && chatSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0 flex flex-col px-4 pt-4 pb-2 overflow-hidden relative z-10"
          >
            <div className="flex items-center gap-2 mb-3.5 px-1">
              <Terminal className="w-3.5 h-3.5 text-gray-600" />
              <p className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest">Active Sessions</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
              {chatSessions.map((session) => {
                const isActiveSession = session.id === activeChatId && pathname === "/chat";
                return (
                  <div
                    key={session.id}
                    onMouseEnter={() => setHoveredSession(session.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    onClick={() => onSessionClick(session.id)}
                    className={`group relative flex items-center gap-3 w-full px-3.5 py-3 rounded-2xl cursor-pointer transition-all duration-300 ${
                      isActiveSession
                        ? "bg-white/5 border border-white/10 text-white shadow-md shadow-black/20"
                        : "hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent"
                    }`}
                  >
                    <MessageCircle className={`w-3.5 h-3.5 shrink-0 transition-colors ${isActiveSession ? colors.textAccent : "text-gray-600 group-hover:text-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold truncate leading-snug">
                        {session.title || "Interactive Session"}
                      </p>
                      <p className="text-[9px] text-gray-600 font-medium font-mono mt-0.5">
                        {formatSessionDate(session.updatedAt)}
                      </p>
                    </div>
                    {(hoveredSession === session.id || confirmDeleteId === session.id) && (
                      <button
                        onClick={(e) => onDelete(e, session.id)}
                        className={`shrink-0 p-1.5 rounded-lg transition-all ${
                          confirmDeleteId === session.id
                            ? "bg-red-500/20 text-red-400"
                            : "hover:bg-white/10 text-gray-600 hover:text-gray-300"
                        }`}
                        title={confirmDeleteId === session.id ? "Click again to delete" : "Delete session"}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terminal Collapse Trigger */}
      <div className="px-4 py-5 border-t border-[var(--card-border)] shrink-0 relative z-10 bg-gradient-to-t from-[var(--background)] to-transparent">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand Command Center" : "Collapse Command Center"}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-gray-500 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/15 transition-all duration-300 text-xs font-bold uppercase tracking-wider"
        >
          {collapsed
            ? <ChevronRight className="w-5 h-5" />
            : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <motion.span
                  animate={{ opacity: 1, width: "auto" }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Collapse Command
                </motion.span>
              </>
            )
          }
        </button>
      </div>
    </motion.aside>
  );
};
