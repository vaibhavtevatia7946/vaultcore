'use client';

import React, { useState } from 'react';
import { LedgerEntry, InvariantAudit } from '@/lib/types';
import { ShieldCheck, ShieldAlert, RefreshCw, Lock, Unlock, AlertTriangle } from 'lucide-react';

interface MerkleChainExplorerProps {
  entries: LedgerEntry[];
  audit: InvariantAudit | null;
  onRefresh: () => void;
}

export const MerkleChainExplorer: React.FC<MerkleChainExplorerProps> = ({
  entries,
  audit,
  onRefresh,
}) => {
  const [isTampering, setIsTampering] = useState(false);
  const [isHealing, setIsHealing] = useState(false);

  const isChainCompromised = audit?.isChainValid === false || !audit?.isBalanced;
  const tamperedId = audit?.tamperedEntryId;
  const chronologicalEntries = [...entries].reverse();

  const handleSimulateTamper = async () => {
    setIsTampering(true);
    try {
      await fetch('/api/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tamper' }),
      });
      onRefresh();
    } catch (err) {
      console.error('Tamper simulation failed', err);
    } finally {
      setIsTampering(false);
    }
  };

  const handleHealChain = async () => {
    setIsHealing(true);
    try {
      await fetch('/api/tamper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'heal' }),
      });
      onRefresh();
    } catch (err) {
      console.error('Healing failed', err);
    } finally {
      setIsHealing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <div className="fintech-card p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isChainCompromised ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                Cryptographic SHA-256 Merkle Chain Verification
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Each block contains the hash of its immediate predecessor. Historical tampering breaks downstream hashes.
            </p>
          </div>

          <div>
            {isChainCompromised ? (
              <button
                onClick={handleHealChain}
                disabled={isHealing}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isHealing ? 'animate-spin' : ''}`} />
                <span>Restore Chain</span>
              </button>
            ) : (
              <button
                onClick={handleSimulateTamper}
                disabled={isTampering || entries.length === 0}
                className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-medium transition-colors"
              >
                Simulate Tamper (+₹5,000)
              </button>
            )}
          </div>
        </div>

        {/* Status notice */}
        {isChainCompromised && (
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <div>
              <strong>Cryptographic mismatch detected:</strong> The hash at entry{' '}
              <span className="font-mono underline">{tamperedId}</span> does not match recorded block inputs.
            </div>
          </div>
        )}
      </div>

      {/* Grid of Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {chronologicalEntries.slice(-9).map((entry, idx) => {
          const isGenesis = entry.id === 'led_genesis_000';
          const isTamperedBlock = entry.id === tamperedId || entry.isTampered;
          const isDownstreamBroken =
            isChainCompromised && idx >= chronologicalEntries.findIndex((e) => e.id === tamperedId);

          return (
            <div
              key={entry.id}
              className={`fintech-card p-3.5 flex flex-col justify-between space-y-2.5 ${
                isTamperedBlock
                  ? 'border-rose-500 bg-rose-50/20 dark:bg-rose-950/20'
                  : isDownstreamBroken
                  ? 'border-amber-400/50'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-medium text-slate-500 dark:text-zinc-500 text-[10px]">
                  {isGenesis ? 'GENESIS BLOCK' : `BLOCK #${idx + 1}`}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                  {entry.type}
                </span>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                  {entry.accountName}
                </div>
                <div className="text-sm font-semibold font-mono-num text-slate-900 dark:text-zinc-100 mt-0.5">
                  ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-1 text-[10px] font-mono">
                <div className="flex justify-between text-slate-400 dark:text-zinc-500">
                  <span>PREV:</span>
                  <span className="truncate max-w-[140px]">{entry.prevHash.substring(0, 14)}...</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-zinc-400">
                  <span>HASH:</span>
                  <span className={`truncate max-w-[140px] font-medium ${isTamperedBlock ? 'text-rose-600 font-bold' : ''}`}>
                    {entry.hash.substring(0, 14)}...
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
