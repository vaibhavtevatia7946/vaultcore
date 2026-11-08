'use client';

import React from 'react';
import { LedgerEntry, Transaction } from '@/lib/types';
import { BookOpen, ArrowUpRight, ArrowDownLeft, ShieldCheck, History } from 'lucide-react';

interface LiveLedgerStreamProps {
  entries: LedgerEntry[];
  transactions: Transaction[];
}

export const LiveLedgerStream: React.FC<LiveLedgerStreamProps> = ({
  entries,
  transactions,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Immutable Double-Entry Ledger Stream
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Every transaction is paired: 1 Debit (Red) + 1 Credit (Green). SHA-256 hash-chained.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Audit Trail Active</span>
        </div>
      </div>

      <div className="fintech-gradient-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090b10] border-b border-white/5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Tx ID</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-right">Balance After</th>
                <th className="py-3 px-4 font-mono">Hash Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {entries.slice(0, 15).map((entry) => {
                const isDebit = entry.type === 'DEBIT';

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(entry.createdAt).toLocaleTimeString()}
                    </td>

                    {/* Tx ID */}
                    <td className="py-3 px-4 text-slate-300 font-semibold">
                      {entry.transactionId.replace('tx_', '')}
                    </td>

                    {/* Account */}
                    <td className="py-3 px-4 text-white font-sans font-medium">
                      {entry.accountName}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-4">
                      {isDebit ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                          <ArrowUpRight className="w-3 h-3" />
                          <span>DEBIT</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          <ArrowDownLeft className="w-3 h-3" />
                          <span>CREDIT</span>
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className={`py-3 px-4 text-right font-bold font-mono-num ${
                      isDebit ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isDebit ? '-' : '+'}${entry.amount.toFixed(2)}
                    </td>

                    {/* Balance After */}
                    <td className="py-3 px-4 text-right text-slate-300 font-mono-num">
                      ${entry.balanceAfter.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Hash */}
                    <td className="py-3 px-4 text-slate-500 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-black/40 border border-white/5 text-slate-400">
                        {entry.hash.substring(0, 14)}...
                      </span>
                    </td>
                  </tr>
                );
              })}

              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No ledger entries recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
