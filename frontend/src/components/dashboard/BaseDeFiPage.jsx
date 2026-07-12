"use client";

import React, { useState } from "react";
import { 
  Compass, ExternalLink, TrendingUp, Layers, Coins, 
  ArrowUpRight, Sparkles, Shield, Info, Activity, Database
} from "lucide-react";
import { motion } from "framer-motion";

const DEXES = [
  { name: "Aerodrome Finance", tvl: "$720.5M", vol24h: "$185.2M", link: "https://aerodrome.finance/", desc: "The central liquidity hub and largest protocol on Base by TVL.", icon: "AERO" },
  { name: "Uniswap V3", tvl: "$240.1M", vol24h: "$120.4M", link: "https://uniswap.org/", desc: "Concentrated liquidity model providing highly efficient token swaps on Base.", icon: "UNI" },
  { name: "BaseSwap", tvl: "$48.2M", vol24h: "$8.1M", link: "https://baseswap.fi/", desc: "Base native DEX featuring classic AMM pools, farming, and staking.", icon: "BSWAP" },
  { name: "SushiSwap", tvl: "$32.4M", vol24h: "$4.2M", link: "https://sushi.com/", desc: "Multi-chain DEX integration offering classic swaps and liquidity incentives.", icon: "SUSHI" }
];

const LENDING = [
  { name: "Aave V3", tvl: "$410.8M", borrowApy: "4.2%", supplyApy: "1.8%", link: "https://aave.com/", desc: "Leading multi-chain borrowing and lending market with deep liquidity." },
  { name: "Moonwell", tvl: "$195.4M", borrowApy: "8.5%", supplyApy: "6.8%", link: "https://moonwell.fi/", desc: "Open lending protocol built specifically for Base and other EVM chains." },
  { name: "Seamless Protocol", tvl: "$112.5M", borrowApy: "5.4%", supplyApy: "3.2%", link: "https://seamlessprotocol.com/", desc: "The first native, decentralized, one-click lending protocol on Base." }
];

const STABLECOINS = [
  { symbol: "USDC", name: "USD Coin", supply: "$2.8B", peg: "$1.00", link: "https://circle.com/", issuer: "Circle (Native)" },
  { symbol: "USDbC", name: "USD Coin (Bridged)", supply: "$210M", peg: "$1.00", link: "https://base.org/", issuer: "Coinbase (Bridged)" },
  { symbol: "DAI", name: "Dai Stablecoin", supply: "$45M", peg: "$1.00", link: "https://makerdao.com/", issuer: "MakerDAO" }
];

const TRENDING = [
  { symbol: "AERO", name: "Aerodrome Token", price: "$1.24", change24h: "+14.2%", volume24h: "$12.8M" },
  { symbol: "WELL", name: "Moonwell Governance", price: "$0.024", change24h: "+8.5%", volume24h: "$2.1M" },
  { symbol: "SEAM", name: "Seamless Governance", price: "$4.82", change24h: "-2.4%", volume24h: "$840K" },
  { symbol: "VIRTUAL", name: "Virtual Protocols", price: "$0.48", change24h: "+28.1%", volume24h: "$8.4M" }
];

export const BaseDeFiPage = () => {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="flex-1 overflow-y-auto bg-transparent relative scrollbar-thin">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[750px] bg-blue-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <div className="px-8 py-7 border-b border-white/5 bg-[#030308]/40 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-[1px] flex items-center justify-center shadow-lg shadow-blue-500/10">
            <div className="w-full h-full rounded-[11px] bg-[#030308] flex items-center justify-center">
              <Compass className="w-5.5 h-5.5 text-blue-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">DeFi Discovery Terminal</h2>
            <p className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase mt-1">Explore the Base L2 Decentralized Finance ecosystem and protocols</p>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 mt-6 bg-[#030308]/60 border border-white/5 rounded-2xl p-1.5 w-fit shadow-md">
          {[
            { id: "all", label: "All DeFi" },
            { id: "dex", label: "DEXes / Swaps" },
            { id: "lend", label: "Lending Markets" },
            { id: "stables", label: "Stablecoins" }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-white/5 border border-white/10 text-blue-400 shadow-md"
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 relative z-10">
        {/* Top Stats Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5.5 rounded-3xl bg-[#030308]/60 border border-white/5 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Base Ecosystem TVL</span>
            <span className="text-2xl font-black text-white font-mono mt-2 block">$1.84 Billion</span>
            <span className="text-[9px] text-emerald-400 font-bold mt-1 block uppercase tracking-wider flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4% past 7 days
            </span>
          </div>
          <div className="p-5.5 rounded-3xl bg-[#030308]/60 border border-white/5 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl" />
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">24h Aggregate Volume</span>
            <span className="text-2xl font-black text-white font-mono mt-2 block">$342.5 Million</span>
            <span className="text-[9px] text-emerald-400 font-bold mt-1 block uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> High Trading Activity
            </span>
          </div>
          <div className="p-5.5 rounded-3xl bg-[#030308]/60 border border-white/5 relative overflow-hidden backdrop-blur-xl">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
            <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">Active Smart Contracts</span>
            <span className="text-2xl font-black text-white font-mono mt-2 block">12,854</span>
            <span className="text-[9px] text-blue-400 font-bold mt-1 block uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5" /> Fast scaling L2 network
            </span>
          </div>
        </div>

        {/* DEXes Section */}
        {(activeCategory === "all" || activeCategory === "dex") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" /> Decentralized Exchanges (DEXes)
              </h3>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {DEXES.map((dex, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5.5 rounded-3xl bg-[#030308]/50 border border-white/5 hover:border-blue-500/30 transition-all backdrop-blur-xl relative group"
                >
                  <div className="flex justify-between items-start mb-3 pb-2.5 border-b border-white/5">
                    <div>
                      <h4 className="font-extrabold text-white text-sm tracking-wide leading-none">{dex.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-1">{dex.desc}</p>
                    </div>
                    <a 
                      href={dex.link} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
                      <span className="text-[8px] text-gray-500 uppercase font-black block tracking-widest mb-0.5">TVL</span>
                      <span className="text-xs font-black text-white">{dex.tvl}</span>
                    </div>
                    <div className="flex-1 p-2.5 rounded-xl bg-white/5 border border-white/5 text-center">
                      <span className="text-[8px] text-gray-500 uppercase font-black block tracking-widest mb-0.5">24h Vol</span>
                      <span className="text-xs font-black text-blue-400">{dex.vol24h}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Lending Section */}
        {(activeCategory === "all" || activeCategory === "lend") && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" /> Lending & Borrowing Protocols
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              {LENDING.map((lend, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-3xl bg-[#030308]/50 border border-white/5 hover:border-indigo-500/30 transition-all backdrop-blur-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-extrabold text-white text-sm tracking-wide leading-none">{lend.name}</h4>
                      <a href={lend.link} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed mb-4">{lend.desc}</p>
                  </div>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Protocol TVL</span>
                      <span className="font-black text-white">{lend.tvl}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-white/5 pb-1.5">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Supply APY</span>
                      <span className="font-black text-emerald-400">{lend.supplyApy}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Borrow APY</span>
                      <span className="font-black text-amber-400">{lend.borrowApy}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Stablecoins Section */}
        {(activeCategory === "all" || activeCategory === "stables") && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Coins className="w-4 h-4 text-cyan-400" /> Stablecoin Reserve Assets
            </h3>
            <div className="overflow-x-auto rounded-3xl border border-white/5 bg-[#030308]/50 backdrop-blur-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] text-gray-500 uppercase font-black tracking-widest">
                    <th className="p-4 px-6">Asset Symbol</th>
                    <th className="p-4">Peg Target</th>
                    <th className="p-4">Total Supply on Base</th>
                    <th className="p-4">Issuer Standard</th>
                    <th className="p-4 text-right px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="font-mono text-xs">
                  {STABLECOINS.map((stable, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/2">
                      <td className="p-4 px-6 font-extrabold text-white flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] flex items-center justify-center text-blue-400 font-bold">
                          {stable.symbol}
                        </span>
                        <div>
                          <span>{stable.symbol}</span>
                          <span className="text-[9px] text-gray-500 font-medium block">{stable.name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-black text-emerald-400">{stable.peg}</td>
                      <td className="p-4 font-black text-white">{stable.supply}</td>
                      <td className="p-4 text-gray-400 font-sans font-semibold text-[10px]">{stable.issuer}</td>
                      <td className="p-4 text-right px-6">
                        <a 
                          href={stable.link} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 font-bold font-sans uppercase tracking-wider"
                        >
                          DOCS <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Trending Tokens */}
        {activeCategory === "all" && (
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" /> Trending Base Ecosystem Tokens
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
              {TRENDING.map((token, i) => (
                <div key={i} className="p-4.5 rounded-2xl bg-[#030308]/60 border border-white/5 backdrop-blur-xl relative">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-mono text-xs font-black text-white block">{token.symbol}</span>
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-0.5 block">{token.name}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-black ${
                      token.change24h.startsWith("+") ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {token.change24h}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-mono mt-4 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[8px] text-gray-600 uppercase font-bold tracking-widest block">Price</span>
                      <span className="font-extrabold text-white mt-0.5 block">{token.price}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] text-gray-600 uppercase font-bold tracking-widest block">24h Vol</span>
                      <span className="font-extrabold text-blue-400 mt-0.5 block">{token.volume24h}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
