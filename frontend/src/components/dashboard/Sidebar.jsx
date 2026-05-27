"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  MessageSquare, History, Bot, TrendingUp, Users,
  ChevronLeft, ChevronRight, Plus, Trash2, MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";
import { useNetwork } from "@/context/NetworkContext";

const NAV_ITEMS = [
  { path: "/chat",     label: "Chat Terminal",  icon: MessageSquare },
  { path: "/stake",    label: "Staking Hub",    icon: TrendingUp },
  { path: "/contacts", label: "Address Book",   icon: Users },
  { path: "/history",  label: "Ledger History", icon: History },
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
      animate={{ width: collapsed ? 84 : 280 }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className={`relative flex-col h-full shrink-0 border-r border-white/5 bg-black/45 backdrop-blur-2xl overflow-hidden z-20 ${className}`}
    >
      {/* Brand header */}
      <div className="px-5 h-16 flex items-center gap-3.5 border-b border-white/5 shrink-0">
        <button
          onClick={() => onNavigate("/chat")}
          className="flex items-center gap-3.5 group min-w-0"
        >
          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${colors.brandGradient} flex items-center justify-center shadow-lg ${colors.accentGlow} group-hover:scale-105 transition-transform duration-300 shrink-0`}>
            <Bot className="w-6 h-6 text-white" />
          </div>
          <motion.div
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap text-left"
          >
            <h1 className={`font-extrabold text-base bg-gradient-to-r ${colors.brandGradient} bg-clip-text text-transparent tracking-wide`}>
              ADA Intent AI
            </h1>
            <p className="text-[11px] text-gray-500 font-mono font-semibold tracking-wider">EXCHANGE v1.0</p>
          </motion.div>
        </button>
      </div>

      {/* New Chat button */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={() => { handleNewChat(); onNavigate("/chat"); }}
          title={collapsed ? "New Chat" : undefined}
          className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-r ${colors.cardGradient} border ${colors.accentBorder} ${colors.accentBorderHover} ${colors.textAccent} transition-all duration-200 font-semibold text-sm group hover:shadow-md ${colors.accentGlow} active:scale-[0.98] cursor-pointer ${collapsed ? "justify-center" : ""}`}
        >
          <Plus className="w-4.5 h-4.5 shrink-0 group-hover:rotate-90 transition-transform duration-200" />
          <motion.span
            animate={{ opacity: collapsed ? 0 : 1, width: collapsed ? 0 : "auto" }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden whitespace-nowrap"
          >
            New Chat
          </motion.span>
        </button>
      </div>

      {/* Nav items */}
      <nav className="px-4 py-2 space-y-1 shrink-0">
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
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-250 text-sm font-semibold group relative ${
                active
                  ? `bg-gradient-to-r ${colors.cardGradient} border ${colors.borderCard} ${colors.textAccent} shadow-md ${colors.accentGlow}`
                  : "text-gray-400 border border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="activeBar"
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full ${colors.pulseBg}`}
                />
              )}
              <Icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${active ? colors.textAccent : "text-gray-400 group-hover:text-white"}`} />
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

      {/* Chat History */}
      <AnimatePresence>
        {!collapsed && chatSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 min-h-0 flex flex-col px-4 pt-3 pb-2 overflow-hidden"
          >
            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mb-2 px-1">Recent Chats</p>
            <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-0.5">
              {chatSessions.map((session) => {
                const isActiveSession = session.id === activeChatId && pathname === "/chat";
                return (
                  <div
                    key={session.id}
                    onMouseEnter={() => setHoveredSession(session.id)}
                    onMouseLeave={() => setHoveredSession(null)}
                    onClick={() => onSessionClick(session.id)}
                    className={`group relative flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                      isActiveSession
                        ? `${colors.accentBg} border ${colors.accentBorder} text-white`
                        : "hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent"
                    }`}
                  >
                    <MessageCircle className={`w-3.5 h-3.5 shrink-0 ${isActiveSession ? colors.textAccent : "text-gray-600 group-hover:text-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium truncate leading-tight">
                        {session.title || "New Chat"}
                      </p>
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {formatSessionDate(session.updatedAt)}
                      </p>
                    </div>
                    {(hoveredSession === session.id || confirmDeleteId === session.id) && (
                      <button
                        onClick={(e) => onDelete(e, session.id)}
                        className={`shrink-0 p-1 rounded-lg transition-all ${
                          confirmDeleteId === session.id
                            ? "bg-red-500/20 text-red-400"
                            : "hover:bg-white/10 text-gray-600 hover:text-gray-300"
                        }`}
                        title={confirmDeleteId === session.id ? "Click again to delete" : "Delete chat"}
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

      {/* Collapse toggle */}
      <div className="px-4 py-5 border-t border-white/5 shrink-0">
        <button
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 transition-all duration-200 text-sm font-semibold"
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
                  Collapse Terminal
                </motion.span>
              </>
            )
          }
        </button>
      </div>
    </motion.aside>
  );
};
