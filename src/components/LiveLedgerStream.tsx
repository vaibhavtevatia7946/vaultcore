'use client';

import React, { useState } from 'react';
import { LedgerEntry, Transaction, InvariantAudit } from '@/lib/types';
import { Download, Search, Table as TableIcon, Layers } from 'lucide-react';
import { MerkleChainExplorer } from './MerkleChainExplorer';

interface LiveLedgerStreamProps {
  entries: LedgerEntry[];
  transactions: Transaction[];
  audit?: InvariantAudit | null;
  onRefresh?: () => void;
}

export const LiveLedgerStream: React.FC<LiveLedgerStreamProps> = ({
  entries,
  transactions,
  audit = null,
  onRefresh = () => {},
}) => {
  const [viewMode, setViewMode] = useState<'TABLE' | 'CHAIN'>('TABLE');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEBIT' | 'CREDIT'>('ALL');

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.vpa && entry.vpa.toLowerCase().includes(searchTerm.toLowerCase())) ||
      entry.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'ALL' || entry.type === filterType;

    return matchesSearch && matchesType;
  });

  const exportCSV = () => {
    const headers = [
      'Entry ID',
      'UPI Transaction ID',
      'Account Name',
      'UPI VPA',
      'Type',
      'Amount (INR)',
      'Balance After (INR)',
      'Prev Hash',
      'SHA256 Hash',
      'Timestamp',
    ];
    const rows = entries.map((e) => [
      e.id,
      e.transactionId,
      `"${e.accountName}"`,
      `"${e.vpa || ''}"`,
      e.type,
      e.amount.toFixed(2),
      e.balanceAfter.toFixed(2),
      e.prevHash || '',
      e.hash,
      e.createdAt,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vaultcore_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
            Immutable Double-Entry Ledger
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Append-only audit trail with cryptographic hash chaining
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View mode toggle */}
          <div className="flex items-center p-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 text-xs">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('CHAIN')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                viewMode === 'CHAIN'
                  ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-sm'
                  : 'text-slate-500 dark:text-zinc-400'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Merkle Chain</span>
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {viewMode === 'CHAIN' ? (
        <MerkleChainExplorer entries={entries} audit={audit} onRefresh={onRefresh} />
      ) : (
        <div className="fintech-card overflow-hidden">
          {/* Controls toolbar */}
          <div className="p-3 border-b border-slate-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search account or txn..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-md pl-8 pr-3 py-1 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono"
              />
            </div>

            <div className="flex items-center space-x-1 self-end sm:self-auto text-xs">
              {(['ALL', 'DEBIT', 'CREDIT'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                    filterType === type
                      ? 'bg-slate-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold'
                      : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Txn ID</th>
                  <th className="py-2.5 px-3">Account & VPA</th>
                  <th className="py-2.5 px-3">Entry</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Balance After</th>
                  <th className="py-2.5 px-3 font-mono">Merkle Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80 font-mono">
                {filteredEntries.slice(0, 50).map((entry) => {
                  const isDebit = entry.type === 'DEBIT';

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors ${
                        entry.isTampered ? 'bg-rose-50 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 text-slate-500 dark:text-zinc-400 text-[11px]">
                        {new Date(entry.createdAt).toLocaleTimeString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300 font-medium">
                        {entry.transactionId.replace('upi_', '')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-900 dark:text-zinc-100 font-sans">
                        <span className="font-medium">{entry.accountName}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isDebit
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-medium font-mono-num ${
                          isDebit
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDebit ? '-' : '+'}₹
                        {entry.amount.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-zinc-300 font-mono-num">
                        ₹
                        {entry.balanceAfter.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 dark:text-zinc-500 text-[11px] truncate max-w-[120px]" title={entry.hash}>
                        <span className={entry.isTampered ? 'text-rose-600 font-bold' : ''}>
                          {entry.hash.substring(0, 12)}...
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
