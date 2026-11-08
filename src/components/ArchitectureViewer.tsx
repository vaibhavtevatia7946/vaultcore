'use client';

import React, { useState } from 'react';
import { Layers, ShieldCheck, Database, Cpu, Lock, CheckCircle, Copy, Terminal } from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const curlExample = `curl -X POST http://localhost:3000/api/transfer \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -d '{
    "sourceAccountId": "acc_alice",
    "destinationAccountId": "acc_bob",
    "amount": 250.00,
    "description": "API Direct Payout"
  }'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Heading */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">System Specification & Engineering Spec</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          VaultCore implements banking-grade architectural patterns designed to handle multi-threaded financial workflows with zero balance drift, strict idempotency, and deadlock-free row locking.
        </p>
      </div>

      {/* The 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1 */}
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Double-Entry Bookkeeping</h3>
              <span className="text-[10px] font-mono text-blue-400">Ledger Invariant Inviolability</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Balances are never modified arbitrarily. For every payment, two ledger rows are written: 1 DEBIT from source, 1 CREDIT to destination. The mathematical sum across all debits and credits is provably zero: <span className="font-mono text-emerald-400 font-semibold">Σ(Debits) - Σ(Credits) = 0</span>.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Deadlock Prevention</h3>
              <span className="text-[10px] font-mono text-purple-400">Lexicographical Resource Ordering</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Eliminates Coffman’s "Circular Wait" deadlock condition by sorting the involved account IDs before lock acquisition. Whether transferring Alice → Bob or Bob → Alice, both threads lock min(ID_A, ID_B) first.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Distributed Idempotency</h3>
              <span className="text-[10px] font-mono text-amber-400">At-Most-Once Execution Guarantee</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every transaction requires an <span className="font-mono text-amber-300">Idempotency-Key</span>. In-flight requests lock the key; completed requests return the exact historical response with <span className="font-mono text-slate-300">X-Idempotent-Replay: true</span> without repeated balance debits.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Audit & Tamper Resistance</h3>
              <span className="text-[10px] font-mono text-emerald-400">SHA-256 Merkle Hash Chaining</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every ledger posting calculates a cryptographic hash incorporating the previous entry hash, transaction ID, and balance after. Any unauthorized database tampering immediately invalidates the audit chain.
          </p>
        </div>
      </div>

      {/* Terminal cURL Tester Box */}
      <div className="rounded-2xl bg-[#06070a] border border-white/10 p-5 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-white">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Direct API Invocation (cURL)</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[11px] font-mono text-slate-300 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-3.5 rounded-xl bg-[#090b10] border border-white/5 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
          {curlExample}
        </pre>
      </div>
    </div>
  );
};
