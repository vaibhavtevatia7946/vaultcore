'use client';

import React from 'react';
import { ShieldCheck, RefreshCw, Activity, Terminal, ArrowRightLeft } from 'lucide-react';
import { InvariantAudit } from '@/lib/types';

interface NavbarProps {
  audit: InvariantAudit | null;
  onReset: () => void;
  isResetting: boolean;
  activeTab: 'dashboard' | 'stress-test' | 'architecture';
  setActiveTab: (tab: 'dashboard' | 'stress-test' | 'architecture') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  audit,
  onReset,
  isResetting,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07080b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">VaultCore</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                v2.4 PROD-SPEC
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Distributed Double-Entry Ledger & Concurrency Engine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 bg-[#0F1118] rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Wallets & Ledger</span>
          </button>
          
          <button
            onClick={() => setActiveTab('stress-test')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'stress-test'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Concurrency Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'architecture'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span className="hidden md:inline">System Spec</span>
          </button>
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center space-x-3">
          {/* Audit Status Pill */}
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0F1118] border border-white/5">
            <span
              className={`w-2 h-2 rounded-full ${
                audit?.isBalanced
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="text-xs font-mono text-slate-300">
              AUDIT: <span className={audit?.isBalanced ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                {audit?.isBalanced ? '100% BALANCED' : 'IMBALANCE DETECTED'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Δ ${audit?.delta ?? 0}
            </span>
          </div>

          {/* Reset Snapshot Button */}
          <button
            onClick={onReset}
            disabled={isResetting}
            title="Reset to Genesis Snapshot"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset State</span>
          </button>
        </div>

      </div>
    </header>
  );
};
