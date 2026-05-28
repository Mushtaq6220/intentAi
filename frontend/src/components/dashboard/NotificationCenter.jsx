"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, BellOff, CheckCheck, Trash2, X, Info, AlertTriangle, CheckCircle, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



export const NotificationCenter = ({
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onRemoveNotification,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case "wallet":
        return <Wallet className="w-4 h-4 text-cyan-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 text-gray-300 hover:text-white transition-all duration-300 active:scale-95 shadow-sm"
      >
        <Bell className="w-5.5 h-5.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 text-[9px] font-bold text-white items-center justify-center font-mono">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Floating Dropdown Tray */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed top-20 left-6 right-6 sm:absolute sm:top-auto sm:left-auto sm:right-0 sm:translate-x-0 sm:mt-3 sm:w-80 rounded-2xl solid-dropdown shadow-2xl z-[100] overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-xs text-white">Notifications</span>
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                     onClick={onMarkAllAsRead}
                    title="Mark all"
                    className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={onClearAll}
                    title="Clear all"
                    className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Feed */}
            <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500 space-y-2">
                  <BellOff className="w-8 h-8 opacity-45" />
                  <span className="text-xs">All caught up!</span>
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex gap-3 transition-colors hover:bg-white/5 relative ${
                      !item.read ? "bg-cyan-500/5" : ""
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!item.read && (
                      <span className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}

                    <div className="shrink-0 mt-0.5">{getIcon(item.type)}</div>

                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-1 leading-normal break-words">
                        {item.message}
                      </p>
                      <span className="text-[9px] text-gray-500 font-mono block mt-2">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <button
                      onClick={() => onRemoveNotification(item.id)}
                      className="text-gray-600 hover:text-red-400 p-0.5 self-start hover:bg-white/5 rounded transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-white/5 bg-black/20 text-center">
              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">
                Secured Intent Node Feed
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
