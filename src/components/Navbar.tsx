'use client';

import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Activity, Terminal, ArrowRightLeft, ExternalLink, X, CheckCircle2, Lock, Layers } from 'lucide-react';
import { InvariantAudit } from '@/lib/types';

interface NavbarProps {
  audit: InvariantAudit | null;
  onReset: () => void;
  isResetting: boolean;
  activeTab: 'dashboard' | 'stress-test' | 'blockchain' | 'architecture';
  setActiveTab: (tab: 'dashboard' | 'stress-test' | 'blockchain' | 'architecture') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  audit,
  onReset,
  isResetting,
  activeTab,
  setActiveTab,
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);

  return (
    <>
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
                  PROD v2.0
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'stress-test'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Concurrency Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('blockchain')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'blockchain'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Merkle Chain</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
            {/* Clickable Audit Status Pill */}
            <button
              onClick={() => setShowAuditModal(true)}
              className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0F1118] border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer group"
              title="Click to view full mathematical audit proof"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  audit?.isBalanced && audit?.isChainValid !== false
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse'
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                }`}
              />
              <span className="text-xs font-mono text-slate-300">
                AUDIT:{' '}
                <span
                  className={
                    audit?.isBalanced && audit?.isChainValid !== false
                      ? 'text-emerald-400 font-semibold'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {audit?.isBalanced && audit?.isChainValid !== false ? '100% INTACT' : 'IMBALANCE DETECTED'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono group-hover:text-emerald-400 transition-colors">
                (View Proof)
              </span>
            </button>

            {/* GitHub Repo Link with official SVG icon */}
            <a
              href="https://github.com/vaibhavtevatia7946/vaultcore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>

            {/* Reset Snapshot Button */}
            <button
              onClick={onReset}
              disabled={isResetting}
              title="Reset to Genesis Snapshot"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>
      </header>

      {/* Audit Invariant Mathematical Proof Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="fintech-gradient-border max-w-lg w-full rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Mathematical Ledger Invariant Proof</h3>
                <p className="text-xs text-slate-400">Real-time Reserve Bank of India (RBI) CBS audit validation</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#08090d] border border-white/5 space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Sum of All Credits:</span>
                <span className="text-emerald-400 font-bold">
                  ₹{(audit?.totalCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Sum of All Debits:</span>
                <span className="text-rose-400 font-bold">
                  ₹{(audit?.totalDebits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
                </span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm">
                <span className="text-white font-semibold">Invariant Delta (Δ):</span>
                <span className="text-emerald-400 font-bold">
                  ₹{(audit?.delta || 0).toFixed(2)} INR
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1">
                <span>Cryptographic Chain:</span>
                <span className={audit?.isChainValid !== false ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-bold'}>
                  {audit?.isChainValid !== false ? 'SHA-256 MERKLE VERIFIED' : 'TAMPER DETECTED'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-center space-x-1.5 text-white font-medium">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>The Core Banking Invariance Formula:</span>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5 font-mono text-cyan-300 text-center font-bold">
                Σ(Credits) - Σ(Debits) ≡ ₹0.00
              </div>
              <p className="text-[11px] text-slate-500">
                Because every single transaction generates equal and opposite debit and credit entries, money can never be fabricated or lost due to software race conditions or network latency.
              </p>
            </div>

            <button
              onClick={() => setShowAuditModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
            >
              Close Invariant Inspector
            </button>
          </div>
        </div>
      )}
    </>
  );
};
