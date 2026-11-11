'use client';

import React, { useState } from 'react';
import { ConcurrencySimulationResult, InvariantAudit, Account } from '@/lib/types';
import { Flame, Play, ShieldCheck, CheckCircle2, AlertOctagon, Terminal, Activity, Gauge, Users, Zap } from 'lucide-react';
import { DeadlockVisualizer } from './DeadlockVisualizer';

interface ConcurrencyStressTesterProps {
  onSimulationFinished: () => void;
  audit: InvariantAudit | null;
  accounts?: Account[];
}

export const ConcurrencyStressTester: React.FC<ConcurrencyStressTesterProps> = ({
  onSimulationFinished,
  audit,
  accounts = [],
}) => {
  const [concurrencyCount, setConcurrencyCount] = useState<number>(40);
  const [amountPerTransfer, setAmountPerTransfer] = useState<number>(250.0);
  const [bypassLocks, setBypassLocks] = useState<boolean>(false);
  const [sourceAccountId, setSourceAccountId] = useState<string>('acc_aarav');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('acc_priya');

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
          sourceAccountId,
          destinationAccountId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data.result);
        onSimulationFinished();
      } else {
        alert(data.error || 'Simulation failed');
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
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Simulate tens of simultaneous cross-payments between two accounts. Observe how VaultCore’s lexicographical resource ordering eliminates circular wait deadlocks while guaranteeing zero balance drift.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={runStressTest}
              disabled={isRunning}
              className={`flex items-center space-x-2 px-5 py-3 rounded-xl text-white text-xs font-semibold shadow-lg transition-all disabled:opacity-50 active:scale-95 ${
                bypassLocks
                  ? 'bg-gradient-to-r from-rose-600 to-amber-600 shadow-rose-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 shadow-purple-600/30'
              }`}
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
        <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Target Accounts Selection */}
          <div className="p-3 rounded-xl bg-[#08090d] border border-white/5 space-y-1">
            <div className="flex items-center space-x-1 text-xs text-slate-300 font-medium">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Cross-Transfer Accounts:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="bg-[#0f1118] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.split(' ')[0]}
                  </option>
                ))}
              </select>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="bg-[#0f1118] border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white font-mono"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              min="50"
              max="1000"
              step="50"
              value={amountPerTransfer}
              onChange={(e) => setAmountPerTransfer(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#08090d] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-300">Locking Engine</div>
              <div className="text-[10px] text-slate-500">
                {bypassLocks ? 'Unsafe (Deadlock risk)' : 'Dijkstra Resource Ordering'}
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

      {/* Visual Deadlock Pipeline */}
      <DeadlockVisualizer isUnsafeMode={bypassLocks} />

      {/* Real-Time Telemetry & Metrics Grid */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in">
          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Throughput</span>
            </div>
            <div className="text-2xl font-bold font-mono-num text-white">
              ~{result.tps} <span className="text-sm font-normal text-slate-400">TPS</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {result.totalRequestsSent} in {result.totalExecutionTimeMs}ms
            </div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Avg Latency</span>
            </div>
            <div className="text-2xl font-bold font-mono-num text-white">
              {result.avgLatencyMs} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">Per worker execution</div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>P95 Latency</span>
            </div>
            <div className="text-2xl font-bold font-mono-num text-purple-400">
              {result.p95LatencyMs} <span className="text-sm font-normal text-slate-400">ms</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500">95th percentile latency</div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Deadlocks Avoided</span>
            </div>
            <div className="text-2xl font-bold font-mono-num text-emerald-400">
              {result.deadlocksAvoided}
            </div>
            <div className="text-[11px] font-mono text-slate-500">Circular wait eliminated</div>
          </div>

          <div className="fintech-gradient-border p-4 rounded-xl space-y-1">
            <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Settlement Rate</span>
            </div>
            <div className="text-2xl font-bold font-mono-num text-white">
              {Math.round((result.successfulTransfers / result.totalRequestsSent) * 100)}%
            </div>
            <div className="text-[11px] font-mono text-slate-500">
              {result.successfulTransfers} passed / {result.rejectedTransfers} rejected
            </div>
          </div>
        </div>
      )}

      {/* Terminal Output Logs */}
      {result && result.logs && (
        <div className="fintech-gradient-border rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-[#090b10] px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>NPCI Engine Concurrency Telemetry Stream</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {result.logs.length} events logged
            </span>
          </div>

          <div className="p-4 bg-[#050608] max-h-56 overflow-y-auto font-mono text-xs space-y-1">
            {result.logs.map((log, index) => {
              const isError = log.includes('REJECTED') || log.includes('ERROR');
              const isAudit = log.includes('AUDIT');
              const isMetric = log.includes('METRICS') || log.includes('COMPLETE');

              return (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    isError
                      ? 'text-rose-400'
                      : isAudit
                      ? 'text-emerald-400 font-semibold'
                      : isMetric
                      ? 'text-purple-300 font-medium'
                      : 'text-slate-400'
                  }`}
                >
                  <span className="text-slate-600 mr-2">{String(index + 1).padStart(2, '0')}</span>
                  {log}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
