'use client';

import React from 'react';
import { Lock, ArrowRight, AlertOctagon, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface DeadlockVisualizerProps {
  isUnsafeMode: boolean;
}

export const DeadlockVisualizer: React.FC<DeadlockVisualizerProps> = ({ isUnsafeMode }) => {
  return (
    <div className="fintech-gradient-border rounded-2xl p-5 bg-[#090b10] border border-white/10 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2">
          <span
            className={`p-1.5 rounded-lg border ${
              isUnsafeMode
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isUnsafeMode ? <AlertOctagon className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </span>
          <div>
            <h3 className="text-sm font-semibold text-white">
              {isUnsafeMode
                ? 'Live Deadlock Trap (Coffman Circular Wait)'
                : 'Dijkstra Resource Ordering Pipeline (Deadlock Free)'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isUnsafeMode
                ? 'Unordered locking allows cross-transfers to mutually block each other forever'
                : 'Lexicographical resource sorting guarantees min(ID_A, ID_B) is acquired first'}
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
            isUnsafeMode
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
          }`}
        >
          {isUnsafeMode ? 'VULNERABLE: DEADLOCK RISK' : 'ACTIVE: 0 DEADLOCKS'}
        </span>
      </div>

      {isUnsafeMode ? (
        /* Unsafe Mode: Circular Wait Visualization */
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thread 1 */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-300">WORKER THREAD #1</span>
                <span className="text-[10px] font-mono text-slate-400">Aarav ➔ Priya</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Holds Lock: acc_aarav (State: LOCKED)</span>
                </div>
                <div className="flex items-center space-x-2 text-rose-400 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Waiting for Lock: acc_priya (BLOCKED)</span>
                </div>
              </div>
            </div>

            {/* Thread 2 */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-300">WORKER THREAD #2</span>
                <span className="text-[10px] font-mono text-slate-400">Priya ➔ Aarav</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Holds Lock: acc_priya (State: LOCKED)</span>
                </div>
                <div className="flex items-center space-x-2 text-rose-400 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  <span>Waiting for Lock: acc_aarav (BLOCKED)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-rose-900/30 border border-rose-500/40 text-[11px] font-mono text-rose-300 flex items-center justify-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>CIRCULAR WAIT DEADLOCK: Neither thread can proceed. Both threads freeze indefinitely!</span>
          </div>
        </div>
      ) : (
        /* VaultCore Protected Mode: Ordered Sequence Visualization */
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Thread 1 Sorted */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">THREAD 1 (Aarav ➔ Priya)</span>
                <span className="text-[10px] font-mono text-slate-400">Sorted Order</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  1. Lock(acc_aarav)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  2. Lock(acc_priya)
                </span>
              </div>
              <div className="text-[11px] text-emerald-400/90 font-mono">
                ✓ Priority 1 lock acquired first
              </div>
            </div>

            {/* Thread 2 Sorted */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-400">THREAD 2 (Priya ➔ Aarav)</span>
                <span className="text-[10px] font-mono text-slate-400">Sorted Order</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-mono text-slate-300">
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  1. Wait(acc_aarav)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  2. Lock(acc_priya)
                </span>
              </div>
              <div className="text-[11px] text-emerald-400/90 font-mono">
                ✓ Waits in orderly queue: Circular wait eliminated
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-emerald-900/30 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              <strong>Dijkstra Invariant:</strong> LockSequence = sort([Payer, Payee]). Deterministic lock queue completely eliminates deadlocks.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
