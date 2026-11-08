'use client';

import React, { useState } from 'react';
import { LedgerEntry, Transaction } from '@/lib/types';
import { BookOpen, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download, Search, Filter } from 'lucide-react';

interface LiveLedgerStreamProps {
  entries: LedgerEntry[];
  transactions: Transaction[];
}

export const LiveLedgerStream: React.FC<LiveLedgerStreamProps> = ({
  entries,
  transactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || entry.type === filterType;

    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    const headers = ['Entry ID', 'Transaction ID', 'Account Name', 'Type', 'Amount', 'Balance After', 'SHA256 Hash', 'Timestamp'];
    const rows = entries.map((e) => [
      e.id,
      e.transactionId,
      `"${e.accountName}"`,
      e.type,
      e.amount.toFixed(2),
      e.balanceAfter.toFixed(2),
      e.hash,
      e.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vaultcore_ledger_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Immutable Double-Entry Ledger Stream
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time audit log: 1 Debit (Red) + 1 Credit (Green). SHA-256 Merkle chain verified.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors shadow-sm"
            title="Export Ledger Records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 rounded-xl bg-[#090b10] border border-white/5">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search account or Tx ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d1017] border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 font-mono"
          />
        </div>

        <div className="flex items-center space-x-1 self-end sm:self-auto">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {(['ALL', 'DEBIT', 'CREDIT'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                filterType === type
                  ? type === 'DEBIT'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : type === 'CREDIT'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="fintech-gradient-border rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#090b10] border-b border-white/5 text-[11px] font-medium text-slate-400 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
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
              {filteredEntries.slice(0, 30).map((entry) => {
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

              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No matching ledger entries found.
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
