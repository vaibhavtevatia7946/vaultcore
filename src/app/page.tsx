'use client';

import React, { useState, useEffect } from 'react';
import { Account, Transaction, LedgerEntry, InvariantAudit, TwoPhaseHold } from '@/lib/types';
import { Navbar } from '../components/Navbar';
import { WalletCards } from '../components/WalletCards';
import { TransferModal } from '../components/TransferModal';
import { LiveLedgerStream } from '../components/LiveLedgerStream';
import { ConcurrencyStressTester } from '../components/ConcurrencyStressTester';
import { ArchitectureViewer } from '../components/ArchitectureViewer';
import { MerkleChainExplorer } from '../components/MerkleChainExplorer';
import { ShieldCheck, Database, Zap, Layers, AlertCircle } from 'lucide-react';

export default function Home() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [activeHolds, setActiveHolds] = useState<TwoPhaseHold[]>([]);
  const [audit, setAudit] = useState<InvariantAudit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stress-test' | 'blockchain' | 'architecture'>('dashboard');

  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedDestId, setSelectedDestId] = useState<string>('');

  useEffect(() => {
    try {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    } catch (_) {}
  }, []);

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('vaultcore-theme', 'dark');
      } catch (_) {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('vaultcore-theme', 'light');
      } catch (_) {}
    }
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setLedgerEntries(data.ledgerEntries || []);
        setActiveHolds(data.activeHolds || []);
        setAudit(data.audit || null);
      }
    } catch (err) {
      console.error('Failed to load ledger state', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      await fetchData();
    } catch (err) {
      console.error('Reset failed', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSelectTransfer = (sourceId: string, destId?: string) => {
    if (sourceId) setSelectedSourceId(sourceId);
    if (destId) setSelectedDestId(destId);
  };

  const totalLiquidity = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalHeld = accounts.reduce((acc, a) => acc + (a.heldBalance || 0), 0);
  const isHealthy = audit?.isBalanced && audit?.isChainValid !== false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex flex-col items-center justify-center space-y-2">
        <div className="w-6 h-6 border-2 border-slate-300 dark:border-zinc-700 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-500 dark:text-zinc-400">Loading ledger state...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        audit={audit}
        onReset={handleReset}
        isResetting={isResetting}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Crisp Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="fintech-card p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Total Liquidity
            </span>
            <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-zinc-100">
              ₹{totalLiquidity.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              Across {accounts.length} core entities
            </span>
          </div>

          <div className="fintech-card p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Audit Invariance
            </span>
            <div
              className={`text-xl font-bold font-mono flex items-center space-x-1.5 ${
                isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
              }`}
            >
              <span>{isHealthy ? 'Balanced' : 'Drift Alert'}</span>
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              Delta: ₹{audit?.delta ?? 0} {totalHeld > 0 ? `(₹${totalHeld} held)` : ''}
            </span>
          </div>

          <div className="fintech-card p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Ledger Postings
            </span>
            <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-zinc-100">
              {audit?.totalLedgerEntries ?? 0}
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              {audit?.totalTransactions ?? 0} settled transactions
            </span>
          </div>

          <div className="fintech-card p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              Transaction Isolation
            </span>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400">
              SERIALIZABLE
            </div>
            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
              Ordered row locks
            </span>
          </div>
        </div>

        {/* Tab 1: Accounts Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <WalletCards
              accounts={accounts}
              onSelectTransfer={handleSelectTransfer}
              selectedSourceId={selectedSourceId}
              onRefresh={fetchData}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-5">
                <TransferModal
                  accounts={accounts}
                  activeHolds={activeHolds}
                  sourceId={selectedSourceId}
                  destId={selectedDestId}
                  setSourceId={setSelectedSourceId}
                  setDestId={setSelectedDestId}
                  onTransferSuccess={fetchData}
                />
              </div>

              <div className="lg:col-span-7">
                <LiveLedgerStream
                  entries={ledgerEntries}
                  transactions={transactions}
                  audit={audit}
                  onRefresh={fetchData}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Concurrency Stress Tester */}
        {activeTab === 'stress-test' && (
          <ConcurrencyStressTester
            onSimulationFinished={fetchData}
            audit={audit}
            accounts={accounts}
          />
        )}

        {/* Tab 3: Merkle Blockchain Explorer */}
        {activeTab === 'blockchain' && (
          <MerkleChainExplorer
            entries={ledgerEntries}
            audit={audit}
            onRefresh={fetchData}
          />
        )}

        {/* Tab 4: Architecture & Spec */}
        {activeTab === 'architecture' && <ArchitectureViewer />}
      </main>

      {/* Minimal Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-zinc-800 py-4 bg-white dark:bg-[#09090b] text-xs text-slate-500 dark:text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-zinc-300">VaultCore</span>
            <span>•</span>
            <span>ACID Core Banking Concurrency Engine</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400 dark:text-zinc-500">
            Dijkstra Resource Ordering • NPCI RRN Idempotency • SHA-256 Merkle Chain
          </div>
        </div>
      </footer>
    </div>
  );
}
