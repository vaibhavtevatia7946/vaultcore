'use client';

import React, { useState } from 'react';
import { Account } from '@/lib/types';
import { QrCode, X, Volume2, Zap } from 'lucide-react';

interface UpiQrModalProps {
  account: Account;
  allAccounts: Account[];
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: () => void;
}

export const UpiQrModal: React.FC<UpiQrModalProps> = ({
  account,
  allAccounts,
  isOpen,
  onClose,
  onPaymentComplete,
}) => {
  const [amount, setAmount] = useState<string>('500');
  const [payerId, setPayerId] = useState<string>(
    allAccounts.find((a) => a.id !== account.id)?.id || ''
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundboxAlert, setSoundboxAlert] = useState<string | null>(null);

  if (!isOpen) return null;

  const playSoundboxVoice = (receivedAmount: number, payeeName: string) => {
    const text = `VaultCore: ${receivedAmount} rupees received for ${payeeName}`;
    setSoundboxAlert(`Received ₹${receivedAmount.toLocaleString('en-IN')} via UPI transfer.`);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {}
    }
  };

  const handleQuickPay = async () => {
    if (!payerId || !amount || Number(amount) <= 0) return;
    setIsProcessing(true);
    setSoundboxAlert(null);

    const rrn = `RRN_QR_${Date.now()}_${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const res = await fetch('/api/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': rrn,
        },
        body: JSON.stringify({
          sourceAccountId: payerId,
          destinationAccountId: account.id,
          amount: parseFloat(amount),
          description: `QR Payment to ${account.name}`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        playSoundboxVoice(parseFloat(amount), account.name);
        onPaymentComplete();
      } else {
        alert(data.error || 'Payment failed');
      }
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="fintech-card max-w-sm w-full p-5 space-y-4 relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
            {account.name}
          </div>
          <div className="text-xs font-mono text-blue-600 dark:text-blue-400">
            {account.vpa}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-zinc-500">
            {account.bankName} • {account.accountNumber}
          </div>
        </div>

        {/* QR Code Container */}
        <div className="flex justify-center my-2">
          <div className="p-4 rounded-xl bg-white text-black border border-slate-200 flex flex-col items-center space-y-2 shadow-sm">
            <div className="w-40 h-40 bg-zinc-900 rounded-lg p-2.5 flex flex-col items-center justify-between">
              <div className="w-full flex justify-between">
                <div className="w-8 h-8 border-4 border-white bg-zinc-900" />
                <div className="w-8 h-8 border-4 border-white bg-zinc-900" />
              </div>
              <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                UPI
              </div>
              <div className="w-full flex justify-between">
                <div className="w-8 h-8 border-4 border-white bg-zinc-900" />
                <div className="text-[10px] font-mono text-white font-medium self-end">
                  ₹{Number(amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-600">
              SCAN TO PAY VIA UPI
            </span>
          </div>
        </div>

        {/* Soundbox Voice Feedback */}
        {soundboxAlert && (
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
            <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{soundboxAlert}</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
            Select Amount
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {['200', '500', '1200', '2500'].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`py-1 rounded text-xs font-mono transition-colors ${
                  amount === preset
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Payer Account */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400">
            Simulate Payer
          </label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 rounded-md px-2 py-1 text-xs text-slate-900 dark:text-zinc-100 font-mono"
          >
            {allAccounts
              .filter((a) => a.id !== account.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — ₹{a.balance.toLocaleString('en-IN')}
                </option>
              ))}
          </select>
        </div>

        {/* Pay Button */}
        <button
          onClick={handleQuickPay}
          disabled={isProcessing || !payerId || Number(amount) <= 0}
          className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-40"
        >
          {isProcessing ? 'Processing...' : `Pay ₹${Number(amount || 0).toLocaleString('en-IN')}`}
        </button>
      </div>
    </div>
  );
};
