"use client";
import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Sliders, Clock, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function RulesPage() {
  const { smartRules, handleToggleRuleStatus } = useDashboard();
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sliders className="w-5 h-5 text-white" />
          </div>
          Smart Intent Rules
        </h2>
        <p className="text-xs text-gray-400 mt-1 ml-12">Manage conditional execution templates linked to blockchain events</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {smartRules.map((rule, idx) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.07 }}
            className="p-5 rounded-2xl glass-panel border border-white/5 flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-white">{rule.name}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-semibold ${
                  rule.status === "active"
                    ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20 animate-pulse-glow"
                    : "bg-gray-500/10 text-gray-400 border-gray-500/25"
                }`}>{rule.status}</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="text-gray-400 font-medium">Condition:</span>
                  <span className="text-gray-200 font-semibold">{rule.condition}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Play className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="text-gray-400 font-medium">Action:</span>
                  <span className="text-gray-200 font-semibold">{rule.action}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggleRuleStatus(rule.id)}
              className={`mt-4 w-full py-2 rounded-xl text-xs font-bold border transition-all ${
                rule.status === "active"
                  ? "bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-400"
                  : "bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/20 text-cyan-300"
              }`}
            >
              {rule.status === "active" ? "Pause Rule" : "Activate Rule"}
            </button>
          </motion.div>
        ))}

        {/* Add New Rule placeholder */}
        <div className="p-5 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center min-h-[180px] cursor-pointer hover:border-cyan-500/40 hover:bg-white/5 transition-all">
          <Sliders className="w-8 h-8 text-gray-500 mb-2" />
          <span className="text-xs font-semibold text-gray-300">Create Conditional Intent</span>
          <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Type conditions like "If ADA price drops" in chat to add rules.</p>
        </div>
      </div>
    </div>
  );
}
