'use client';

import React, { useState } from 'react';
import { ConcurrencySimulationResult, InvariantAudit } from '@/lib/types';
import { Flame, Play, ShieldCheck, CheckCircle2, AlertOctagon, Terminal } from 'lucide-react';

interface ConcurrencyStressTesterProps {
  onSimulationFinished: () => void;
  audit: InvariantAudit | null;
}

export const ConcurrencyStressTester: React.FC<ConcurrencyStressTesterProps> = ({
  onSimulationFinished,
  audit,
}) => {
  const [concurrencyCount, setConcurrencyCount] = useState<number>(40);
  const [amountPerTransfer, setAmountPerTransfer] = useState<number>(500.00);
  const [bypassLocks, setBypassLocks] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<ConcurrencySimulationResult | null>(null);

  const runStressTest = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concurrencyCount,
          amountPerTransfer,
          bypassLocks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
        onSimulationFinished();
      }
    } catch (err: any) {
      console.error('Stress test failed', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="fintech-gradient-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Flame className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                High-Concurrency UPI Switch & Deadlock Lab
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Simulate tens of simultaneous cross-payments between Aarav (`aarav@oksbi`) and Priya (`priya@icici`). Test how VaultCore’s lexicographical resource ordering eliminates circular wait deadlocks while guaranteeing zero balance drift.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runStressTest}
              disabled={isRunning}
              className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 active:scale-95"
            >
              {isRunning ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Executing Parallel UPI Workers...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Fire {concurrencyCount} Concurrent UPI Requests</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Configuration Controls */}
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-[#08090d] border border-white/5">
            <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
              <span>Concurrent Workers:</span>
              <span className="font-mono text-purple-400 font-bold">{concurrencyCount} Threads</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={concurrencyCount}
              onChange={(e) => setConcurrencyCount(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#08090d] border border-white/5">
            <div className="flex justify-between text-xs text-slate-300 font-medium mb-1">
              <span>Transfer per Worker:</span>
              <span className="font-mono text-purple-400 font-bold">₹{amountPerTransfer.toLocaleString('en-IN')}</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="100"
              value={amountPerTransfer}
              onChange={(e) => setAmountPerTransfer(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#08090d] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-300">Locking Mechanism</div>
              <div className="text-[10px] text-slate-500">
                {bypassLocks ? 'Unsafe (Dirty-read hazard)' : 'Resource-ordered row locks'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBypassLocks(!bypassLocks)}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                bypassLocks
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {bypassLocks ? 'BYPASS LOCKS' : 'VAULTCORE SAFE'}
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Results Grid */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Total Execution Time
            </span>
            <div className="text-2xl font-bold font-mono-num text-white">
              {result.totalExecutionTimeMs} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Avg latency: {result.avgLatencyMs}ms / txn
            </div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Settled UPI Transfers
            </span>
            <div className="text-2xl font-bold font-mono-num text-emerald-400">
              {result.successfulTransfers} / {result.totalRequestsSent}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              Rejected: {result.rejectedTransfers}
            </div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              Deadlocks Avoided
            </span>
            <div className="text-2xl font-bold font-mono-num text-purple-400 flex items-center space-x-2">
              <span>{result.deadlocksAvoided}</span>
              <CheckCircle2 className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              0 circular wait halts
            </div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              RBI Invariant Delta
            </span>
            <div className={`text-2xl font-bold font-mono-num flex items-center space-x-2 ${
              result.auditInvariantMaintained ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              <span>₹{audit?.delta ?? 0}</span>
              {result.auditInvariantMaintained ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertOctagon className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {result.auditInvariantMaintained ? '100% Math Balance Intact' : 'Balance Drift Detected'}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Worker Thread Grid Simulation */}
      {result && (
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span>UPI Switch Worker Map ({result.totalRequestsSent} Nodes)</span>
            <span className="font-mono text-slate-400 text-[11px]">
              Green = Atomic Commit | Red = Filtered / Locked
            </span>
          </div>

          <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5 p-3 rounded-xl bg-[#07080b] border border-white/5">
            {Array.from({ length: result.totalRequestsSent }).map((_, idx) => {
              const isSuccess = idx < result.successfulTransfers;
              return (
                <div
                  key={idx}
                  title={`UPI Worker #${idx + 1}: ${isSuccess ? 'Committed' : 'Rejected'}`}
                  className={`h-6 rounded-md flex items-center justify-center text-[10px] font-mono font-bold transition-all ${
                    isSuccess
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Terminal Live Output */}
      {result && (
        <div className="rounded-2xl bg-[#06070a] border border-white/10 p-4 font-mono text-xs space-y-2 shadow-2xl">
          <div className="flex items-center space-x-2 pb-2 border-b border-white/5 text-slate-400">
            <Terminal className="w-4 h-4 text-purple-400" />
            <span className="font-semibold text-white">NPCI Switch Event Stream</span>
            <span className="text-[10px] text-slate-600">stdout</span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-2 text-slate-300">
            {result.logs.map((line, idx) => (
              <div key={idx} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-slate-600 select-none">&gt;</span>
                <span className={line.includes('AUDIT') || line.includes('COMPLETE') ? 'text-emerald-400 font-bold' : ''}>
                  {line}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
