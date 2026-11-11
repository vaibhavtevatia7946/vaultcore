'use client';

import React, { useState } from 'react';
import { Account } from '@/lib/types';
import { Send, ArrowDownLeft, QrCode, Lock } from 'lucide-react';
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

  const getBankMonogram = (bankName: string) => {
    if (bankName.includes('State Bank')) return 'SBI';
    if (bankName.includes('ICICI')) return 'ICICI';
    if (bankName.includes('Paytm')) return 'PYTM';
    if (bankName.includes('HDFC')) return 'HDFC';
    if (bankName.includes('Reserve Bank')) return 'RBI';
    return bankName.substring(0, 3).toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
            Core Banking Accounts & Wallets
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Real-time balance states protected by row-level locking
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500 dark:text-zinc-500">
          {accounts.length} active entities
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((acc) => {
          const isSelected = selectedSourceId === acc.id;
          const hasHeldFunds = (acc.heldBalance || 0) > 0;
          const monogram = getBankMonogram(acc.bankName);

          return (
            <div
              key={acc.id}
              className={`fintech-card p-4 flex flex-col justify-between transition-all duration-150 ${
                isSelected
                  ? 'ring-2 ring-blue-600 dark:ring-blue-500 border-transparent shadow-sm'
                  : ''
              }`}
            >
              <div>
                {/* Header: Monogram, Name, and VPA */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center font-mono font-bold text-xs text-slate-800 dark:text-zinc-200">
                      {monogram}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                        {acc.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                        {acc.vpa}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    {acc.type}
                  </span>
                </div>

                {/* Account Number & Bank */}
                <div className="mt-3 text-[11px] text-slate-500 dark:text-zinc-400 flex items-center justify-between">
                  <span>{acc.bankName}</span>
                  <span className="font-mono text-[10px] text-slate-400 dark:text-zinc-500">
                    {acc.accountNumber}
                  </span>
                </div>

                {/* Balance Display */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Available Balance
                    </span>
                    {hasHeldFunds && (
                      <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Held: ₹{acc.heldBalance?.toLocaleString('en-IN')}</span>
                      </span>
                    )}
                  </div>

                  <div className="text-xl font-semibold font-mono-num text-slate-900 dark:text-zinc-100 tracking-tight mt-0.5">
                    ₹
                    {acc.balance.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-800/80 grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onSelectTransfer(acc.id)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>

                <button
                  onClick={() => onSelectTransfer('', acc.id)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  <span>Receive</span>
                </button>

                <button
                  onClick={() => setActiveQrAccount(acc)}
                  className="flex items-center justify-center space-x-1 py-1.5 px-2 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
                >
                  <QrCode className="w-3 h-3" />
                  <span>QR</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code Modal */}
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
