'use client';

import React, { useState } from 'react';
import { Account } from '@/lib/types';
import { Send, ArrowDownLeft, Store, UserCheck, Landmark, QrCode, Lock } from 'lucide-react';
import { UpiQrModal } from './UpiQrModal';

interface WalletCardsProps {
  accounts: Account[];
  onSelectTransfer: (sourceId: string, destId?: string) => void;
  selectedSourceId: string;
  onRefresh: () => void;
}

export const WalletCards: React.FC<WalletCardsProps> = ({
  accounts,
  onSelectTransfer,
  selectedSourceId,
  onRefresh,
}) => {
  const [activeQrAccount, setActiveQrAccount] = useState<Account | null>(null);

  const getBadge = (type: Account['type']) => {
    switch (type) {
      case 'MERCHANT':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Store className="w-3 h-3" />
            <span>Merchant QR</span>
          </span>
        );
      case 'TREASURY':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Landmark className="w-3 h-3" />
            <span>RBI Settlement Pool</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserCheck className="w-3 h-3" />
            <span>UPI Account</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Active Indian Bank Accounts & Wallets</h2>
          <p className="text-xs text-slate-400">
            NPCI & Core Banking System (CBS) ACID ledger-backed accounts with row-level locks
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">{accounts.length} entities on NPCI switch</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isSelected = selectedSourceId === acc.id;
          const hasHeldFunds = (acc.heldBalance || 0) > 0;

          return (
            <div
              key={acc.id}
              className={`group relative rounded-2xl p-4 transition-all duration-300 fintech-gradient-border ${
                isSelected
                  ? 'border-blue-500/50 shadow-[0_0_25px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/40'
                  : 'hover:border-white/20'
              }`}
            >
              {/* Top Row: Avatar & Badges */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${acc.avatarColor} flex items-center justify-center text-white font-bold text-sm shadow-md`}
                  >
                    {acc.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {acc.name}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[10px] font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.2 rounded border border-cyan-500/20">
                        {acc.vpa}
                      </span>
                    </div>
                  </div>
                </div>
                {getBadge(acc.type)}
              </div>

              {/* Bank Details */}
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{acc.bankName}</span>
                <span className="font-mono text-[10px] text-slate-500">{acc.accountNumber}</span>
              </div>

              {/* Middle Row: Balance */}
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    Available Balance
                  </div>
                  {hasHeldFunds && (
                    <div className="flex items-center space-x-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Held: ₹{acc.heldBalance?.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-baseline space-x-1">
                  <span className="text-sm font-bold text-slate-400">₹</span>
                  <span className="text-2xl font-bold font-mono-num text-white tracking-tight">
                    {acc.balance.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs font-mono text-slate-500">INR</span>
                </div>
              </div>

              {/* Bottom Row: Quick Actions */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  onClick={() => onSelectTransfer(acc.id)}
                  className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-600 text-xs font-medium transition-all"
                  title="Select as Payer"
                >
                  <Send className="w-3 h-3" />
                  <span>Pay</span>
                </button>

                <button
                  onClick={() => onSelectTransfer('', acc.id)}
                  className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
                  title="Select as Payee"
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  <span>Receive</span>
                </button>

                <button
                  onClick={() => setActiveQrAccount(acc)}
                  className="flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-white border border-cyan-500/20 hover:border-cyan-500 text-xs font-medium transition-all"
                  title="Show UPI QR Code"
                >
                  <QrCode className="w-3 h-3" />
                  <span>QR</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* UPI QR Modal */}
      {activeQrAccount && (
        <UpiQrModal
          account={activeQrAccount}
          allAccounts={accounts}
          isOpen={Boolean(activeQrAccount)}
          onClose={() => setActiveQrAccount(null)}
          onPaymentComplete={() => {
            onRefresh();
            setActiveQrAccount(null);
          }}
        />
      )}
    </div>
  );
};
