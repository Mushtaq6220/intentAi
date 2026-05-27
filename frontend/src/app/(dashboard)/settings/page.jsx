"use client";
import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Settings className="w-5 h-5 text-white" />
          </div>
          System Settings
        </h2>
        <p className="text-xs text-gray-400 mt-1 ml-12">Configure your AI parser profiles and blockfrost network parameters</p>
      </div>

      <div className="space-y-4 max-w-lg">
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white">AI Language Engine</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Parser model for extracting tx metadata</p>
          </div>
          <select className="bg-black/60 border border-white/10 text-xs rounded-lg px-2 py-1 text-white outline-none focus:border-cyan-400">
            <option>Groq Llama 3 (Fast &amp; Free) — Active</option>
            <option>Heuristic Sandbox (Fallback)</option>
            <option>Ollama Local (Coming Soon)</option>
          </select>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-white">Cardano Network Pipeline</h4>
            <p className="text-[10px] text-gray-500 mt-0.5">Select target network endpoint config</p>
          </div>
          <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono font-medium">Preprod Testnet</span>
        </div>

        <div className="p-4 rounded-xl bg-white/5 border border-white/5">
          <h4 className="text-xs font-semibold text-white">Mock API Keys (Blockfrost)</h4>
          <p className="text-[10px] text-gray-500 mt-0.5 mb-2.5">Used for blockchain query indexing</p>
          <input type="password" value="••••••••••••••••" disabled className="w-full bg-black/60 border border-white/10 text-xs rounded-lg p-2 text-gray-500 font-mono" />
        </div>
      </div>
    </div>
  );
}
