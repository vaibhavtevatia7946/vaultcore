'use client';

import React from 'react';
import { Account } from '@/lib/types';
import { Send, ArrowDownLeft, Building2, UserCheck, Landmark } from 'lucide-react';

interface WalletCardsProps {
  accounts: Account[];
  onSelectTransfer: (sourceId: string, destId?: string) => void;
  selectedSourceId: string;
}

export const WalletCards: React.FC<WalletCardsProps> = ({
  accounts,
  onSelectTransfer,
  selectedSourceId,
}) => {
  const getBadge = (type: Account['type']) => {
    switch (type) {
      case 'MERCHANT':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Building2 className="w-3 h-3" />
            <span>Merchant</span>
          </span>
        );
      case 'TREASURY':
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Landmark className="w-3 h-3" />
            <span>Treasury Pool</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <UserCheck className="w-3 h-3" />
            <span>Consumer</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Active Wallets</h2>
          <p className="text-xs text-slate-400">
            PostgreSQL ACID ledger-backed balances with row-level locks
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">{accounts.length} entities tracked</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((acc) => {
          const isSelected = selectedSourceId === acc.id;

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
                    <p className="text-[11px] font-mono text-slate-400">{acc.accountNumber}</p>
                  </div>
                </div>
                {getBadge(acc.type)}
              </div>

              {/* Middle Row: Balance */}
              <div className="mt-4 pt-3 border-t border-white/5">
                <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                  Available Balance
                </div>
                <div className="flex items-baseline space-x-1 mt-0.5">
                  <span className="text-xs font-mono text-slate-400">$</span>
                  <span className="text-2xl font-bold font-mono-num text-white tracking-tight">
                    {acc.balance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-xs font-mono text-slate-500">{acc.currency}</span>
                </div>
              </div>

              {/* Bottom Row: Quick Actions */}
              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => onSelectTransfer(acc.id)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 hover:border-blue-600 text-xs font-medium transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send From</span>
                </button>
                <button
                  onClick={() => onSelectTransfer('', acc.id)}
                  className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium transition-all"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Receive To</span>
                </button>
              </div>

              {/* Subtle Account ID in bottom corner */}
              <div className="mt-2 text-right">
                <span className="text-[10px] font-mono text-slate-600">ID: {acc.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
