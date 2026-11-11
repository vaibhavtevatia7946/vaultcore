'use client';

import React, { useState, useEffect } from 'react';
import { Account, Transaction, TwoPhaseHold } from '@/lib/types';
import { Send, Key, RotateCcw, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

interface TransferModalProps {
  accounts: Account[];
  activeHolds?: TwoPhaseHold[];
  sourceId: string;
  destId: string;
  setSourceId: (id: string) => void;
  setDestId: (id: string) => void;
  onTransferSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  accounts,
  activeHolds = [],
  sourceId,
  destId,
  setSourceId,
  setDestId,
  onTransferSuccess,
}) => {
  const [mode, setMode] = useState<'INSTANT' | 'TWOPHASE'>('INSTANT');
  const [amount, setAmount] = useState<string>('1500.00');
  const [description, setDescription] = useState<string>('Vendor invoice settlement');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [holdActionLoading, setHoldActionLoading] = useState<string | null>(null);

  const [lastResult, setLastResult] = useState<{
    success: boolean;
    tx?: Transaction;
    replayed?: boolean;
    error?: string;
  } | null>(null);

  const generateNewKey = () => {
    const rrn = `RRN_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;
    setIdempotencyKey(rrn);
  };

  useEffect(() => {
    generateNewKey();
    if (!sourceId && accounts.length > 0) {
      setSourceId(accounts[0].id);
    }
    if (!destId && accounts.length > 1) {
      setDestId(accounts[1].id);
    }
  }, [accounts]);

  const sourceAccount = accounts.find((a) => a.id === sourceId);
  const isInsufficient = sourceAccount && Number(amount) > sourceAccount.balance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !destId || !amount || !idempotencyKey) return;

    setIsSubmitting(true);
    setLastResult(null);

    try {
      if (mode === 'INSTANT') {
        const res = await fetch('/api/transfer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            sourceAccountId: sourceId,
            destinationAccountId: destId,
            amount: parseFloat(amount),
            description,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setLastResult({
            success: true,
            tx: data.data,
            replayed: data.replayedFromCache,
          });
          onTransferSuccess();
        } else {
          setLastResult({
            success: false,
            error: data.error || 'Transfer failed',
          });
        }
      } else {
        const res = await fetch('/api/hold', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
          },
          body: JSON.stringify({
            action: 'create',
            sourceAccountId: sourceId,
            destinationAccountId: destId,
            amount: parseFloat(amount),
            description,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setLastResult({ success: true });
          onTransferSuccess();
        } else {
          setLastResult({
            success: false,
            error: data.error || 'Pre-auth hold failed',
          });
        }
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        error: err.message || 'Network error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCaptureHold = async (holdId: string) => {
    setHoldActionLoading(holdId);
    try {
      const res = await fetch('/api/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'capture', holdId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onTransferSuccess();
      } else {
        alert(data.error || 'Capture failed');
      }
    } catch (err: any) {
      alert(err.message || 'Capture failed');
    } finally {
      setHoldActionLoading(null);
    }
  };

  const handleVoidHold = async (holdId: string) => {
    setHoldActionLoading(holdId);
    try {
      const res = await fetch('/api/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'void', holdId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onTransferSuccess();
      } else {
        alert(data.error || 'Void failed');
      }
    } catch (err: any) {
      alert(err.message || 'Void failed');
    } finally {
      setHoldActionLoading(null);
    }
  };

  return (
    <div className="fintech-card p-5 space-y-4">
      {/* Header with Segment Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Payment Transfer
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Atomic double-entry ledger settlement
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-xs">
          <button
            type="button"
            onClick={() => setMode('INSTANT')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              mode === 'INSTANT'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            Direct Transfer
          </button>
          <button
            type="button"
            onClick={() => setMode('TWOPHASE')}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
              mode === 'TWOPHASE'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                : 'text-slate-500 dark:text-zinc-400'
            }`}
          >
            Pre-Auth Hold
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Payer and Payee selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Debit Account
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — ₹{a.balance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-700 dark:text-zinc-300 mb-1">
              Credit Account
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === sourceId}>
                  {a.name} {a.id === sourceId ? '(Debit)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-700 dark:text-zinc-300">
              Amount (INR)
            </label>
            {sourceAccount && (
              <span className={`text-[11px] font-mono ${isInsufficient ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-500 dark:text-zinc-400'}`}>
                Avail: ₹{sourceAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 font-medium text-sm">
              ₹
            </span>
            <input
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg pl-7 pr-3 py-2 text-sm font-mono-num font-semibold text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
              placeholder="0.00"
            />
          </div>

          {/* Quick preset chips */}
          <div className="flex items-center space-x-1.5 mt-2">
            {['250', '650', '1500', '5000'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 transition-colors"
              >
                ₹{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-[11px] font-medium text-slate-700 dark:text-zinc-300 mb-1">
            Memo / Remarks
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600"
            placeholder="Reference description"
          />
        </div>

        {/* Idempotency Key */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-zinc-300 flex items-center space-x-1">
              <Key className="w-3 h-3 text-slate-400 dark:text-zinc-500" />
              <span>Idempotency Key (RRN)</span>
            </span>
            <button
              type="button"
              onClick={generateNewKey}
              className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-0.5"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Regenerate</span>
            </button>
          </div>
          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 text-[11px] font-mono text-slate-700 dark:text-zinc-300 focus:outline-none"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || Boolean(isInsufficient) || !amount || Number(amount) <= 0}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Processing Transaction...</span>
          ) : (
            <span>
              {mode === 'INSTANT'
                ? `Post Transfer of ₹${Number(amount || 0).toLocaleString('en-IN')}`
                : `Authorize Hold of ₹${Number(amount || 0).toLocaleString('en-IN')}`}
            </span>
          )}
        </button>
      </form>

      {/* Result Callout */}
      {lastResult && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-start space-x-2 ${
            lastResult.success
              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-300'
          }`}
        >
          {lastResult.success ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 text-xs">
            <div className="font-semibold">
              {lastResult.success
                ? mode === 'INSTANT'
                  ? lastResult.replayed
                    ? 'Replayed from Idempotency Cache'
                    : 'Transfer Settled'
                  : 'Pre-Auth Hold Placed'
                : 'Transaction Failed'}
            </div>
            <div className="opacity-90 font-mono text-[11px]">
              {lastResult.error ||
                (lastResult.tx &&
                  `Txn: ${lastResult.tx.id} • ${lastResult.tx.executionTimeMs}ms`)}
            </div>
          </div>
        </div>
      )}

      {/* Two-Phase Holds Table */}
      {mode === 'TWOPHASE' && activeHolds.filter((h) => h.status === 'HELD').length > 0 && (
        <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-zinc-200">
            <span>Pending Pre-Auth Holds</span>
            <span className="font-mono text-slate-500">
              {activeHolds.filter((h) => h.status === 'HELD').length}
            </span>
          </div>

          <div className="space-y-1.5">
            {activeHolds
              .filter((h) => h.status === 'HELD')
              .map((hold) => (
                <div
                  key={hold.id}
                  className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-medium text-slate-900 dark:text-zinc-100 font-mono">
                      ₹{hold.amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {hold.sourceAccountName} ➔ {hold.destinationAccountName}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCaptureHold(hold.id)}
                      disabled={holdActionLoading === hold.id}
                      className="px-2 py-1 rounded bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-zinc-900 text-[10px] font-medium"
                    >
                      Capture
                    </button>
                    <button
                      onClick={() => handleVoidHold(hold.id)}
                      disabled={holdActionLoading === hold.id}
                      className="px-2 py-1 rounded border border-slate-200 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 text-[10px]"
                    >
                      Void
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
