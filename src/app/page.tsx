'use client';

import React, { useState, useEffect } from 'react';
import { Account, Transaction, LedgerEntry, InvariantAudit } from '@/lib/types';
import { Navbar } from '../components/Navbar';
import { WalletCards } from '../components/WalletCards';
import { TransferModal } from '../components/TransferModal';
import { LiveLedgerStream } from '../components/LiveLedgerStream';
import { ConcurrencyStressTester } from '../components/ConcurrencyStressTester';
import { ArchitectureViewer } from '../components/ArchitectureViewer';
import { ShieldCheck, Database, Zap, Layers, RefreshCw } from 'lucide-react';

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [audit, setAudit] = useState<InvariantAudit | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stress-test' | 'architecture'>('dashboard');

  const [selectedSourceId, setSelectedSourceId] = useState<string>('');
  const [selectedDestId, setSelectedDestId] = useState<string>('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/accounts');
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts || []);
        setTransactions(data.transactions || []);
        setLedgerEntries(data.ledgerEntries || []);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07080b] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-400">Bootstrapping VaultCore Ledger Engine...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        audit={audit}
        onReset={handleReset}
        isResetting={isResetting}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Hero Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="fintech-gradient-border p-4 rounded-2xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Total System Liquidity</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-white">
              ${totalLiquidity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] font-mono text-slate-500">Distributed across {accounts.length} wallets</span>
          </div>

          <div className="fintech-gradient-border p-4 rounded-2xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Audit Integrity Status</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 flex items-center space-x-1.5">
              <span>{audit?.isBalanced ? '100% INTACT' : 'DRIFT DETECTED'}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              Invariant delta: ${audit?.delta ?? 0}
            </span>
          </div>

          <div className="fintech-gradient-border p-4 rounded-2xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Total Ledger Postings</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono-num text-white">
              {audit?.totalLedgerEntries ?? 0}
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {audit?.totalTransactions ?? 0} completed transactions
            </span>
          </div>

          <div className="fintech-gradient-border p-4 rounded-2xl space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Isolation & Locks</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono text-purple-400">
              SERIALIZABLE
            </div>
            <span className="text-[10px] font-mono text-slate-500">Deadlock-free resource ordering</span>
          </div>
        </div>

        {/* Tab 1: Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Section: Wallets Grid */}
            <WalletCards
              accounts={accounts}
              onSelectTransfer={handleSelectTransfer}
              selectedSourceId={selectedSourceId}
            />

            {/* Middle Section: Transfer Console + Live Ledger Stream */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5">
                <TransferModal
                  accounts={accounts}
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
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Concurrency Stress Tester */}
        {activeTab === 'stress-test' && (
          <div className="animate-fade-in">
            <ConcurrencyStressTester
              onSimulationFinished={fetchData}
              audit={audit}
            />
          </div>
        )}

        {/* Tab 3: Architecture & System Spec */}
        {activeTab === 'architecture' && (
          <div className="animate-fade-in">
            <ArchitectureViewer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-6 bg-[#07080b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">VaultCore</span>
            <span>•</span>
            <span>High-Throughput Distributed Payment Ledger</span>
          </div>
          <div className="font-mono text-[11px] text-slate-600">
            Engineered for High-Concurrency FinTech Portfolios
          </div>
        </div>
      </footer>
    </div>
  );
}
