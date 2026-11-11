'use client';

import React, { useState } from 'react';
import { Account } from '@/lib/types';
import { QrCode, X, CheckCircle2, Volume2, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

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

  const payerAccount = allAccounts.find((a) => a.id === payerId);

  const playSoundboxVoice = (receivedAmount: number, payeeName: string) => {
    const text = `VaultCore Soundbox: ${receivedAmount} rupees received for ${payeeName}`;
    setSoundboxAlert(`🔔 ${payeeName} received ₹${receivedAmount.toLocaleString('en-IN')} via VaultCore UPI Engine!`);

    // Use browser Web Speech API for voice announcement if supported
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Fallback gracefully if speech blocked
      }
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
          description: `UPI QR Scan & Pay (${account.name})`,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#090b10] border border-white/10 p-6 shadow-2xl space-y-5 fintech-gradient-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-semibold">
            <QrCode className="w-3.5 h-3.5" />
            <span>BHIM UPI 2.0 DYNAMIC QR</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">{account.name}</h3>
          <p className="text-xs font-mono text-cyan-400">{account.vpa}</p>
          <p className="text-[11px] text-slate-400">{account.bankName} • {account.accountNumber}</p>
        </div>

        {/* QR Code Graphic Frame */}
        <div className="flex justify-center">
          <div className="relative p-5 rounded-2xl bg-white text-black shadow-xl flex flex-col items-center space-y-2">
            {/* Simulated UPI QR Matrix */}
            <div className="w-44 h-44 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-between relative overflow-hidden">
              <div className="w-full flex justify-between">
                <div className="w-10 h-10 border-4 border-cyan-400 bg-white flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900" />
                </div>
                <div className="w-10 h-10 border-4 border-cyan-400 bg-white flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900" />
                </div>
              </div>

              {/* Center Logo */}
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md border-2 border-white">
                UPI
              </div>

              <div className="w-full flex justify-between">
                <div className="w-10 h-10 border-4 border-cyan-400 bg-white flex items-center justify-center">
                  <div className="w-4 h-4 bg-slate-900" />
                </div>
                <div className="text-[9px] font-mono font-bold text-white tracking-tighter self-end">
                  ₹{Number(amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-slate-800 tracking-wider">
              SCAN WITH ANY UPI APP
            </span>
          </div>
        </div>

        {/* Soundbox Voice Alert Banner */}
        {soundboxAlert && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2.5 animate-bounce">
            <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="font-sans font-medium">{soundboxAlert}</div>
          </div>
        )}

        {/* Quick Amount Presets */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Enter Amount or Choose Preset:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['100', '500', '1200', '2500'].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className={`py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
                  amount === preset
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>
        </div>

        {/* Payer Account Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Simulate Payer (Debit Account):
          </label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="w-full bg-[#0d1017] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
          >
            {allAccounts
              .filter((a) => a.id !== account.id)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.vpa}) - Avail: ₹{a.balance.toLocaleString('en-IN')}
                </option>
              ))}
          </select>
        </div>

        {/* Scan & Pay Button */}
        <button
          onClick={handleQuickPay}
          disabled={isProcessing || !payerId || Number(amount) <= 0}
          className="w-full flex items-center justify-center space-x-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Simulate Instant UPI Scan & Pay ₹{Number(amount || 0).toLocaleString('en-IN')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
