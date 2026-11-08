'use client';

import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '@/lib/types';
import { Send, Key, Clock, ShieldAlert, CheckCircle2, RotateCcw, Zap } from 'lucide-react';

interface TransferModalProps {
  accounts: Account[];
  sourceId: string;
  destId: string;
  setSourceId: (id: string) => void;
  setDestId: (id: string) => void;
  onTransferSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  accounts,
  sourceId,
  destId,
  setSourceId,
  setDestId,
  onTransferSuccess,
}) => {
  const [amount, setAmount] = useState<string>('1500.00');
  const [description, setDescription] = useState<string>('Dinner bill split via UPI');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [simulatedLatency, setSimulatedLatency] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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
    } catch (err: any) {
      setLastResult({
        success: false,
        error: err.message || 'NPCI switch timeout / network error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fintech-gradient-border rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Initiate UPI 2.0 Transfer</h2>
            <p className="text-[11px] text-slate-400">Atomic double-entry posting with NPCI RRN idempotency</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          NPCI SWITCH COMPLIANT
        </span>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

        {/* Amount Input & Fast Presets */}
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
              required
            />
          </div>

          {/* Preset Buttons in INR */}
          <div className="flex items-center space-x-2 mt-2">
            {[500, 1000, 2000, 5000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toFixed(2))}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-mono text-slate-300 transition-colors"
              >
                +₹{val.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>

        {/* NPCI RRN / Idempotency Key Section */}
        <div className="p-3 rounded-xl bg-[#090b10] border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs text-slate-300 font-medium">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>NPCI RRN / Idempotency-Key</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={generateNewKey}
                className="text-[10px] font-mono text-blue-400 hover:text-blue-300 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New RRN</span>
              </button>
            </div>
          </div>
          <input
            type="text"
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full bg-[#0e1017] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400/50"
            required
          />
          <p className="text-[10px] text-slate-500">
            UPI Protocol Guarantee: Submitting with identical RRN safely replays the previous confirmation without double-debiting.
          </p>
        </div>

        {/* Simulated Network Latency Slider */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Simulate Bank CBS Latency:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="250"
              step="25"
              value={simulatedLatency}
              onChange={(e) => setSimulatedLatency(Number(e.target.value))}
              className="w-24 accent-blue-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-300 w-12 text-right">
              {simulatedLatency}ms
            </span>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || Boolean(isInsufficient)}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-lg ${
            isInsufficient
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-[0.99]'
          } disabled:opacity-50`}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Acquiring Bank Locks & Settling on NPCI Switch...</span>
            </>
          ) : isInsufficient ? (
            <>
              <ShieldAlert className="w-4 h-4" />
              <span>Insufficient Funds in Payer Bank Account</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-cyan-300" />
              <span>Pay ₹{parseFloat(amount || '0').toLocaleString('en-IN')} via UPI</span>
            </>
          )}
        </button>
      </form>

      {/* Result Card Feedback */}
      {lastResult && (
        <div
          className={`mt-4 p-3.5 rounded-xl border text-xs animate-fade-in ${
            lastResult.success
              ? lastResult.replayed
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-start space-x-2">
            {lastResult.success ? (
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 space-y-1">
              <div className="font-semibold flex items-center justify-between">
                <span>
                  {lastResult.success
                    ? lastResult.replayed
                      ? '⚡ IDEMPOTENT RRN REPLAY DETECTED'
                      : '✓ UPI SETTLEMENT SUCCESSFUL'
                    : '✗ UPI TRANSACTION FAILED'}
                </span>
                {lastResult.tx && (
                  <span className="font-mono text-[10px] opacity-75">
                    {lastResult.tx.executionTimeMs}ms
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-90">
                {lastResult.success
                  ? lastResult.replayed
                    ? 'Identical confirmation returned from in-memory cache without repeating account debit.'
                    : `Settled ₹${lastResult.tx?.amount.toLocaleString('en-IN')} from ${lastResult.tx?.sourceAccountName} (${lastResult.tx?.sourceVpa}) to ${lastResult.tx?.destinationAccountName} (${lastResult.tx?.destinationVpa}).`
                  : lastResult.error}
              </p>
              {lastResult.tx && (
                <div className="pt-1 flex items-center space-x-2 text-[10px] font-mono opacity-80">
                  <span>Txn: {lastResult.tx.id}</span>
                  <span>•</span>
                  <span>Locks: [{lastResult.tx.lockAcquiredOrder.join(' → ')}]</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
