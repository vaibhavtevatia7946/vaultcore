'use client';

import React, { useState } from 'react';
import { LedgerEntry, Transaction, InvariantAudit } from '@/lib/types';
import { BookOpen, ArrowUpRight, ArrowDownLeft, ShieldCheck, Download, Search, Filter, Layers, Table as TableIcon } from 'lucide-react';
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
    link.setAttribute('download', `vaultcore_upi_ledger_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Top Header, View Switcher & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Immutable Double-Entry Ledger Stream (CBS / RBI Audit)
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time audit log: 1 Payer Debit (Red) + 1 Payee Credit (Green). SHA-256 Merkle chain verified.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#090b10] border border-white/5">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                viewMode === 'TABLE'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('CHAIN')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-medium transition-all ${
                viewMode === 'CHAIN'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Blockchain View</span>
            </button>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors shadow-sm"
            title="Export Ledger Records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {viewMode === 'CHAIN' ? (
        <MerkleChainExplorer entries={entries} audit={audit} onRefresh={onRefresh} />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 rounded-xl bg-[#090b10] border border-white/5">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search VPA (e.g. aarav@oksbi) or Txn..."
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
                    <th className="py-3 px-4">Time (IST)</th>
                    <th className="py-3 px-4">UPI Txn ID</th>
                    <th className="py-3 px-4">Account & VPA</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Balance After (₹)</th>
                    <th className="py-3 px-4 font-mono">Merkle Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {filteredEntries.slice(0, 40).map((entry) => {
                    const isDebit = entry.type === 'DEBIT';

                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          entry.isTampered
                            ? 'bg-rose-950/30'
                            : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {new Date(entry.createdAt).toLocaleTimeString('en-IN')}
                        </td>

                        {/* Tx ID */}
                        <td className="py-3 px-4 text-slate-300 font-semibold">
                          {entry.transactionId.replace('upi_', '')}
                        </td>

                        {/* Account & VPA */}
                        <td className="py-3 px-4 text-white font-sans">
                          <div className="font-medium">{entry.accountName}</div>
                          {entry.vpa && (
                            <div className="text-[10px] font-mono text-cyan-400 opacity-80">{entry.vpa}</div>
                          )}
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isDebit
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {isDebit ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                            <span>{entry.type}</span>
                          </span>
                        </td>

                        {/* Amount */}
                        <td
                          className={`py-3 px-4 text-right font-semibold font-mono-num ${
                            isDebit ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isDebit ? '-' : '+'}₹
                          {entry.amount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Balance After */}
                        <td className="py-3 px-4 text-right text-slate-300 font-mono-num">
                          ₹
                          {entry.balanceAfter.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>

                        {/* Merkle Hash */}
                        <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-[140px]" title={entry.hash}>
                          <span className={entry.isTampered ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                            {entry.hash.substring(0, 14)}...
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
