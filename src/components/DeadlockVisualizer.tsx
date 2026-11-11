'use client';

import React from 'react';
import { ArrowRight, Lock, ShieldCheck, AlertCircle } from 'lucide-react';

interface DeadlockVisualizerProps {
  isUnsafeMode: boolean;
}

export const DeadlockVisualizer: React.FC<DeadlockVisualizerProps> = ({ isUnsafeMode }) => {
  return (
    <div className="fintech-card p-4 space-y-3">
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-zinc-800">
        <div className="flex items-center space-x-2">
          {isUnsafeMode ? (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          )}
          <div>
            <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
              {isUnsafeMode
                ? 'Deadlock Hazard: Circular Wait Condition'
                : 'Dijkstra Resource Ordering: Deterministic Lock Sequence'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-zinc-400">
              {isUnsafeMode
                ? 'Unordered thread locking permits cross-transfers to mutually block indefinitely'
                : 'Lexicographical sorting forces min(ID_A, ID_B) first, eliminating circular wait'}
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
            isUnsafeMode
              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
          }`}
        >
          {isUnsafeMode ? 'Unsafe' : 'Protected'}
        </span>
      </div>

      {isUnsafeMode ? (
        <div className="p-3 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] text-slate-500">THREAD 1 (Aarav ➔ Priya)</span>
              <div className="text-emerald-600 dark:text-emerald-400">Holds: acc_aarav</div>
              <div className="text-rose-600 dark:text-rose-400">Waiting for: acc_priya (BLOCKED)</div>
            </div>
            <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] text-slate-500">THREAD 2 (Priya ➔ Aarav)</span>
              <div className="text-emerald-600 dark:text-emerald-400">Holds: acc_priya</div>
              <div className="text-rose-600 dark:text-rose-400">Waiting for: acc_aarav (BLOCKED)</div>
            </div>
          </div>
          <p className="text-[11px] text-rose-800 dark:text-rose-300 font-medium text-center">
            Circular dependency: neither thread can proceed. Both threads hang forever.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-900/40 border border-slate-200 dark:border-zinc-800 space-y-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] text-slate-500">THREAD 1 (Aarav ➔ Priya)</span>
              <div className="text-slate-700 dark:text-zinc-300">
                1. Lock(acc_aarav) ➔ 2. Lock(acc_priya)
              </div>
            </div>
            <div className="p-2.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] text-slate-500">THREAD 2 (Priya ➔ Aarav)</span>
              <div className="text-slate-700 dark:text-zinc-300">
                1. Lock(acc_aarav) ➔ 2. Lock(acc_priya)
              </div>
            </div>
          </div>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium text-center">
            Both threads acquire resources in identical sequence. Circular wait is mathematically eliminated.
          </p>
        </div>
      )}
    </div>
  );
};
