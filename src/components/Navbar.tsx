'use client';

import React, { useState } from 'react';
import {
  Shield,
  RefreshCw,
  Activity,
  Terminal,
  Layers,
  ArrowRightLeft,
  ExternalLink,
  X,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';
import { InvariantAudit } from '@/lib/types';

interface NavbarProps {
  audit: InvariantAudit | null;
  onReset: () => void;
  isResetting: boolean;
  activeTab: 'dashboard' | 'stress-test' | 'blockchain' | 'architecture';
  setActiveTab: (tab: 'dashboard' | 'stress-test' | 'blockchain' | 'architecture') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  audit,
  onReset,
  isResetting,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
}) => {
  const [showAuditModal, setShowAuditModal] = useState(false);
  const isHealthy = audit?.isBalanced && audit?.isChainValid !== false;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-zinc-800 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand - Crisp & Authentic */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                VaultCore
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-zinc-500 hidden md:inline">
                / Core Banking Ledger
              </span>
            </div>
          </div>

          {/* Segmented Navigation Tabs (Stripe / Linear style) */}
          <nav className="flex items-center p-0.5 bg-slate-100 dark:bg-zinc-900 rounded-lg border border-slate-200/80 dark:border-zinc-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Accounts</span>
            </button>

            <button
              onClick={() => setActiveTab('stress-test')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'stress-test'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Concurrency Lab</span>
            </button>

            <button
              onClick={() => setActiveTab('blockchain')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'blockchain'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Merkle Chain</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition-all ${
                activeTab === 'architecture'
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Spec</span>
            </button>
          </nav>

          {/* Right Tools & Theme Controls */}
          <div className="flex items-center space-x-2">
            {/* Status Indicator */}
            <button
              onClick={() => setShowAuditModal(true)}
              className="hidden lg:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-300 hover:border-slate-300 dark:hover:border-zinc-700 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'
                }`}
              />
              <span className="font-mono text-[11px]">
                Audit: {isHealthy ? '100% Balanced' : 'Drift Alert'}
              </span>
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
            </button>

            {/* GitHub Repo */}
            <a
              href="https://github.com/vaibhavtevatia7946/vaultcore"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors"
              title="GitHub Repository"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>

            {/* Reset */}
            <button
              onClick={onReset}
              disabled={isResetting}
              title="Reset state to initial snapshot"
              className="p-1.5 rounded-md border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Audit Invariant Mathematical Proof Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="fintech-card max-w-md w-full p-5 space-y-4 relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <button
              onClick={() => setShowAuditModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  Double-Entry Invariance Proof
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Continuous mathematical balance audit
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                <span>Sum of All Credits:</span>
                <span className="text-slate-900 dark:text-zinc-100 font-medium">
                  ₹{(audit?.totalCredits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 dark:text-zinc-400">
                <span>Sum of All Debits:</span>
                <span className="text-slate-900 dark:text-zinc-100 font-medium">
                  ₹{(audit?.totalDebits || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-900 dark:text-zinc-100">Balance Delta (Δ):</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  ₹{(audit?.delta || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-zinc-500 pt-1">
                <span>Merkle Hash Chain:</span>
                <span className={audit?.isChainValid !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 font-bold'}>
                  {audit?.isChainValid !== false ? 'VERIFIED INTACT' : 'TAMPER DETECTED'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-300 space-y-1">
              <div className="font-semibold font-mono">Σ(Credits) - Σ(Debits) ≡ ₹0.00</div>
              <p className="opacity-90 leading-relaxed">
                Every transaction generates equal and opposite debit and credit entries. Balance cannot be lost or fabricated due to race conditions or network timeouts.
              </p>
            </div>

            <button
              onClick={() => setShowAuditModal(false)}
              className="w-full py-2 rounded-lg bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-900 font-medium text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
