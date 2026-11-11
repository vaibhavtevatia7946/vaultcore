'use client';

import React, { useState } from 'react';
import { LedgerEntry, InvariantAudit } from '@/lib/types';
import { ShieldCheck, ShieldAlert, Link2, RefreshCw, AlertTriangle, CheckCircle2, Lock, Unlock, Flame } from 'lucide-react';

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

  // Chronological order from oldest to newest for visual pipeline flow
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
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="fintech-gradient-border rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div
          className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isChainCompromised ? 'bg-rose-600/20' : 'bg-emerald-600/10'
          }`}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className={`p-1.5 rounded-lg border ${
                  isChainCompromised
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {isChainCompromised ? (
                  <ShieldAlert className="w-5 h-5 animate-pulse" />
                ) : (
                  <ShieldCheck className="w-5 h-5" />
                )}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Cryptographic SHA-256 Merkle Chain Explorer
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Every UPI transaction is linked to its chronological predecessor via an immutable SHA-256 hash. If even a single byte or amount in historical storage is forged, the entire cryptographic chain breaks downstream immediately.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isChainCompromised ? (
              <button
                onClick={handleHealChain}
                disabled={isHealing}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isHealing ? 'animate-spin' : ''}`} />
                <span>Self-Heal & Restore Ledger Integrity</span>
              </button>
            ) : (
              <button
                onClick={handleSimulateTamper}
                disabled={isTampering || entries.length === 0}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 hover:border-rose-500 text-xs font-semibold shadow-lg shadow-rose-500/10 transition-all disabled:opacity-50 group"
              >
                <Flame className="w-4 h-4 text-rose-400 group-hover:text-white" />
                <span>Simulate Database Tamper (+₹5,000)</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Callout */}
        <div
          className={`mt-5 p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
            isChainCompromised
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {isChainCompromised ? (
              <>
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 animate-bounce" />
                <span>
                  <strong>CRITICAL ALERT:</strong> Cryptographic verification failed! Hash chain severed at Entry ID{' '}
                  <span className="font-bold underline text-white">{tamperedId || 'UNKNOWN'}</span>.
                </span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>VERIFIED INTACT:</strong> All {entries.length} blocks mathematically linked from Genesis to Head.
                </span>
              </>
            )}
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-black/40">
            {isChainCompromised ? 'Audit Compromised' : 'Zero Drift Certified'}
          </span>
        </div>
      </div>

      {/* Visual Chained Blocks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5 font-medium">
            <Link2 className="w-4 h-4 text-cyan-400" />
            <span>Chronological Block Chain Pipeline (Oldest ➔ Latest Head)</span>
          </div>
          <span className="font-mono text-[11px] text-slate-500">{entries.length} Chained Blocks</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chronologicalEntries.slice(-12).map((entry, idx) => {
            const isGenesis = entry.id === 'led_genesis_000';
            const isTamperedBlock = entry.id === tamperedId || entry.isTampered;
            const isDownstreamBroken = isChainCompromised && idx >= chronologicalEntries.findIndex((e) => e.id === tamperedId);

            return (
              <div
                key={entry.id}
                className={`relative rounded-2xl p-4.5 transition-all duration-300 border flex flex-col justify-between ${
                  isTamperedBlock
                    ? 'bg-rose-950/30 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] ring-1 ring-rose-500'
                    : isDownstreamBroken
                    ? 'bg-amber-950/20 border-amber-500/40 opacity-90'
                    : 'bg-[#090b10] border-white/10 hover:border-blue-500/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                        {isGenesis ? 'GENESIS BLOCK' : `BLOCK #${idx + 1}`}
                      </span>
                      {isTamperedBlock && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500 text-white font-bold animate-pulse">
                          MALICIOUS TAMPER
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-white font-sans">{entry.accountName}</div>
                  </div>

                  <span
                    className={`p-1.5 rounded-lg border ${
                      isTamperedBlock || isDownstreamBroken
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {isTamperedBlock || isDownstreamBroken ? (
                      <Unlock className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </span>
                </div>

                {/* Amount & Type Badge */}
                <div className="my-3 py-2 px-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Amount</span>
                    <div className="text-sm font-bold font-mono text-white">
                      ₹{entry.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      entry.type === 'DEBIT'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {entry.type}
                  </span>
                </div>

                {/* Hashes */}
                <div className="space-y-1.5 text-[10px] font-mono pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-slate-500">PREV HASH:</span>
                    <span className="text-cyan-400/90 truncate max-w-[170px]" title={entry.prevHash}>
                      {entry.prevHash.substring(0, 16)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-500">BLOCK HASH:</span>
                    <span
                      className={`truncate max-w-[170px] font-semibold ${
                        isTamperedBlock ? 'text-rose-400 font-bold' : 'text-emerald-400'
                      }`}
                      title={entry.hash}
                    >
                      {entry.hash.substring(0, 16)}...
                    </span>
                  </div>
                </div>

                {/* Footer Timestamp */}
                <div className="mt-3 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Txn: {entry.transactionId.replace('upi_', '')}</span>
                  <span>{new Date(entry.createdAt).toLocaleTimeString('en-IN')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
