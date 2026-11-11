'use client';

import React, { useState } from 'react';
import { ConcurrencySimulationResult, InvariantAudit, Account } from '@/lib/types';
import { Play, Terminal } from 'lucide-react';
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
    <div className="space-y-4">
      {/* Configuration Header */}
      <div className="fintech-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              High-Concurrency Stress Testing Lab
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Benchmark parallel cross-transfers and verify zero race-condition balance drift
            </p>
          </div>

          <button
            onClick={runStressTest}
            disabled={isRunning}
            className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-sm text-white transition-all disabled:opacity-50 flex items-center space-x-1.5 ${
              bypassLocks
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isRunning ? (
              <span>Executing {concurrencyCount} Workers...</span>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run {concurrencyCount} Parallel Transfers</span>
              </>
            )}
          </button>
        </div>

        {/* Controls */}
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
            <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
              Target Accounts
            </span>
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <select
                value={sourceAccountId}
                onChange={(e) => setSourceAccountId(e.target.value)}
                className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded px-1.5 py-1 text-[11px] font-mono text-slate-900 dark:text-zinc-100"
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
                className="bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded px-1.5 py-1 text-[11px] font-mono text-slate-900 dark:text-zinc-100"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              <span>Concurrent Workers</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">{concurrencyCount}</span>
            </div>
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={concurrencyCount}
              onChange={(e) => setConcurrencyCount(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-blue-600 h-1 bg-slate-200 dark:bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600 dark:text-zinc-400 font-medium">
              <span>Amount / Worker</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-zinc-100">₹{amountPerTransfer}</span>
            </div>
            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={amountPerTransfer}
              onChange={(e) => setAmountPerTransfer(Number(e.target.value))}
              disabled={isRunning}
              className="w-full accent-blue-600 h-1 bg-slate-200 dark:bg-zinc-800 rounded cursor-pointer"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">Locking Engine</div>
              <div className="text-[10px] text-slate-500">
                {bypassLocks ? 'Unordered locks' : 'Resource ordered'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBypassLocks(!bypassLocks)}
              disabled={isRunning}
              className={`px-2 py-1 rounded text-[11px] font-mono font-medium transition-colors ${
                bypassLocks
                  ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-900'
                  : 'bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200'
              }`}
            >
              {bypassLocks ? 'Unsafe' : 'Safe'}
            </button>
          </div>
        </div>
      </div>

      {/* Deadlock Visualizer */}
      <DeadlockVisualizer isUnsafeMode={bypassLocks} />

      {/* Metrics Result Grid */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="fintech-card p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase">Throughput</span>
            <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-zinc-100">
              ~{result.tps} <span className="text-xs font-normal text-slate-400">TPS</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{result.totalRequestsSent} in {result.totalExecutionTimeMs}ms</span>
          </div>

          <div className="fintech-card p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase">Avg Latency</span>
            <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-zinc-100">
              {result.avgLatencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Mean per request</span>
          </div>

          <div className="fintech-card p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase">P95 Latency</span>
            <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-zinc-100">
              {result.p95LatencyMs} <span className="text-xs font-normal text-slate-400">ms</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">95th percentile</span>
          </div>

          <div className="fintech-card p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase">Deadlocks Avoided</span>
            <div className="text-xl font-bold font-mono-num text-emerald-600 dark:text-emerald-400">
              {result.deadlocksAvoided}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Resource ordering</span>
          </div>

          <div className="fintech-card p-3 space-y-0.5">
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase">Success Rate</span>
            <div className="text-xl font-bold font-mono-num text-slate-900 dark:text-zinc-100">
              {Math.round((result.successfulTransfers / result.totalRequestsSent) * 100)}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">{result.successfulTransfers} settled</span>
          </div>
        </div>
      )}

      {/* Terminal Log */}
      {result && result.logs && (
        <div className="fintech-card overflow-hidden">
          <div className="px-3.5 py-2 border-b border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5 font-mono text-slate-600 dark:text-zinc-400">
              <Terminal className="w-3.5 h-3.5" />
              <span>Execution Telemetry Logs</span>
            </div>
            <span className="font-mono text-[10px] text-slate-400">{result.logs.length} entries</span>
          </div>
          <div className="p-3 bg-white dark:bg-black font-mono text-xs max-h-48 overflow-y-auto space-y-1">
            {result.logs.map((log, index) => {
              const isError = log.includes('REJECTED') || log.includes('ERROR');
              const isAudit = log.includes('AUDIT');

              return (
                <div
                  key={index}
                  className={`leading-relaxed ${
                    isError
                      ? 'text-rose-600 dark:text-rose-400'
                      : isAudit
                      ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  <span className="text-slate-400 dark:text-zinc-600 mr-2">{String(index + 1).padStart(2, '0')}</span>
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
