'use client';

import React, { useState, useEffect } from 'react';
import { Account, Transaction, TwoPhaseHold } from '@/lib/types';
import { Send, Key, Clock, ShieldAlert, CheckCircle2, RotateCcw, Zap, Lock, ShieldCheck, ArrowRight, XCircle } from 'lucide-react';

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
  const [description, setDescription] = useState<string>('Dinner bill split via UPI');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [simulatedLatency, setSimulatedLatency] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [holdActionLoading, setHoldActionLoading] = useState<string | null>(null);

  const [lastResult, setLastResult] = useState<{
    success: boolean;
    tx?: Transaction;
    replayed?: boolean;
    error?: string;
  } | null>(null);

  // Generate NPCI Retrieval Reference Number (RRN) / UUID format
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
  const destAccount = accounts.find((a) => a.id === destId);
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
            simulatedLatencyMs: simulatedLatency,
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
            error: data.error || 'UPI Transfer failed',
          });
        }
      } else {
        // Two-Phase Hold
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
            description: `[PRE-AUTH] ${description}`,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setLastResult({
            success: true,
            error: undefined,
          });
          onTransferSuccess();
        } else {
          setLastResult({
            success: false,
            error: data.error || 'Hold creation failed',
          });
        }
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        error: err.message || 'NPCI switch timeout / network error',
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
    <div className="fintech-gradient-border rounded-2xl p-5 shadow-2xl space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Initiate UPI 2.0 Settlement</h2>
            <p className="text-[11px] text-slate-400">Atomic double-entry posting with NPCI RRN idempotency</p>
          </div>
        </div>

        {/* Mode Pill Toggle */}
        <div className="flex items-center p-0.5 rounded-lg bg-[#090b10] border border-white/5">
          <button
            type="button"
            onClick={() => setMode('INSTANT')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
              mode === 'INSTANT'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant UPI
          </button>
          <button
            type="button"
            onClick={() => setMode('TWOPHASE')}
            className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
              mode === 'TWOPHASE'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Two-Phase Hold
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source and Destination Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
              Payer UPI Account (Debit)
            </label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full bg-[#090b10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.vpa}) - ₹{a.balance.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
              Payee UPI Account (Credit)
            </label>
            <select
              value={destId}
              onChange={(e) => setDestId(e.target.value)}
              className="w-full bg-[#090b10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id} disabled={a.id === sourceId}>
                  {a.name} ({a.vpa}) {a.id === sourceId ? '(Payer)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Amount Input & Fast 1-Click Presets */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-medium text-slate-300 uppercase tracking-wider">
              Amount (INR ₹)
            </label>
            {sourceAccount && (
              <span className={`text-[11px] font-mono ${isInsufficient ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                Available: ₹{sourceAccount.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            )}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
            <input
              type="number"
              step="1"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#090b10] border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm font-mono-num font-semibold text-white focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          {/* Quick Amount Presets */}
          <div className="flex items-center space-x-2 mt-2">
            {[
              { label: '₹250 (Coffee)', val: '250' },
              { label: '₹640 (Swiggy)', val: '640' },
              { label: '₹1,500 (Split)', val: '1500' },
              { label: '₹5,000 (Rent)', val: '5000' },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setAmount(preset.val)}
                className="px-2 py-1 rounded-md text-[10px] font-mono font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description Input */}
        <div>
          <label className="block text-[11px] font-medium text-slate-300 uppercase tracking-wider mb-1">
            Transaction Note / UPI Remarks
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#090b10] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            placeholder="e.g. Dinner split, Swiggy food order, rent payment"
          />
        </div>

        {/* Idempotency Key & RRN Section */}
        <div className="p-3 rounded-xl bg-[#08090d] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-slate-300 text-[11px] font-medium">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>NPCI Retrieval Reference Number (RRN)</span>
            </div>
            <button
              type="button"
              onClick={generateNewKey}
              className="flex items-center space-x-1 text-[10px] font-mono text-blue-400 hover:text-blue-300"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Generate New RRN</span>
            </button>
          </div>

          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full bg-[#0d1017] border border-white/5 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none"
          />
          <p className="text-[10px] text-slate-500 leading-normal">
            Retrying this transfer with the same RRN will safely replay the existing response with zero double-charge.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || Boolean(isInsufficient) || !amount || Number(amount) <= 0}
          className={`w-full flex items-center justify-center space-x-2 py-3 rounded-xl text-white text-xs font-semibold shadow-lg transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${
            mode === 'INSTANT'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-600/25'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-purple-600/25'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Acquiring Row Locks & Posting to UPI Ledger...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>
                {mode === 'INSTANT'
                  ? `Execute UPI Transfer ₹${Number(amount || 0).toLocaleString('en-IN')}`
                  : `Initiate Pre-Auth Hold ₹${Number(amount || 0).toLocaleString('en-IN')}`}
              </span>
            </>
          )}
        </button>
      </form>

      {/* Result Alert Feedback */}
      {lastResult && (
        <div
          className={`p-3.5 rounded-xl border text-xs animate-fade-in ${
            lastResult.success
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {lastResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-semibold">
                {lastResult.success
                  ? mode === 'INSTANT'
                    ? lastResult.replayed
                      ? 'Replayed from Idempotency Cache (0 DB Debits)'
                      : 'UPI Double-Entry Ledger Settled'
                    : 'Pre-Auth Escrow Funds Held Successfully'
                  : 'UPI Switch Transaction Rejected'}
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">
                {lastResult.error ||
                  (lastResult.tx &&
                    `Txn ID: ${lastResult.tx.id} • Latency: ${lastResult.tx.executionTimeMs}ms • Lock Order: [${lastResult.tx.lockAcquiredOrder.join(
                      ', '
                    )}]`)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Holds Manager (Two-Phase Commit) */}
      {mode === 'TWOPHASE' && activeHolds.filter((h) => h.status === 'HELD').length > 0 && (
        <div className="pt-3 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Active Two-Phase Escrow Holds</span>
            </div>
            <span className="font-mono text-[10px] text-amber-400">
              {activeHolds.filter((h) => h.status === 'HELD').length} Active
            </span>
          </div>

          <div className="space-y-2">
            {activeHolds
              .filter((h) => h.status === 'HELD')
              .map((hold) => (
                <div
                  key={hold.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-white">
                      ₹{hold.amount.toLocaleString('en-IN')} • {hold.sourceAccountName} ➔ {hold.destinationAccountName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">{hold.description}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCaptureHold(hold.id)}
                      disabled={holdActionLoading === hold.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-semibold transition-all"
                    >
                      {holdActionLoading === hold.id ? 'Settling...' : 'Capture (Settle)'}
                    </button>
                    <button
                      onClick={() => handleVoidHold(hold.id)}
                      disabled={holdActionLoading === hold.id}
                      className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-semibold transition-all"
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
