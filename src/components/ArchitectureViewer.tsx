'use client';

import React, { useState } from 'react';
import { Layers, ShieldCheck, Database, Cpu, Lock, CheckCircle, Copy, Terminal } from 'lucide-react';

export const ArchitectureViewer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const curlExample = `curl -X POST https://vaultcore-mu.vercel.app/api/transfer \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: RRN_$(date +%s)_$(shuf -i 100000-999999 -n 1 2>/dev/null || echo 551920)" \\
  -d '{
    "sourceAccountId": "acc_aarav",
    "destinationAccountId": "acc_priya",
    "amount": 2500.00,
    "description": "UPI P2P Split via VaultCore"
  }'`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(curlExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Intro Heading */}
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
            Banking Architecture & Technical Specification
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-3xl">
          VaultCore models the core banking infrastructure behind modern payment platforms (Stripe, Razorpay, PhonePe). It enforces RBI-mandated double-entry auditability, NPCI RRN idempotency, and deadlock-free settlement.
        </p>
      </div>

      {/* The 4 Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Pillar 1 */}
        <div className="fintech-card p-4 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                Core Banking Double-Entry
              </h4>
              <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                Invariable Balance Theorem
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Every transaction writes two immutable records: 1 DEBIT to the payer and 1 CREDIT to the payee. The balance equation is continuously verified: <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">Σ(Credits) - Σ(Debits) ≡ ₹0.00</span>.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="fintech-card p-4 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                Deadlock-Free Resource Ordering
              </h4>
              <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400">
                Dijkstra Coffman Resolution
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            When users transfer to each other simultaneously, circular wait deadlocks are eliminated by sorting account IDs lexicographically before acquiring locks (`min(ID_A, ID_B)` first).
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="fintech-card p-4 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                NPCI RRN Idempotency Guard
              </h4>
              <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                Zero Duplicate Debits on Network Retries
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Every write request requires a unique idempotency key. In-flight requests lock the key; completed payments return the cached payload without secondary ledger debits.
          </p>
        </div>

        {/* Pillar 4 */}
        <div className="fintech-card p-4 space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-zinc-100">
                SHA-256 Merkle Chain
              </h4>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                Cryptographic Tamper-Evidence
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            Each entry computes a hash over prior block hash, transaction ID, amounts, and timestamps. Any manual DB modification breaks the cryptographic link downstream.
          </p>
        </div>
      </div>

      {/* Curl Snippet Section */}
      <div className="fintech-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-zinc-100">
            <Terminal className="w-4 h-4 text-slate-500" />
            <span>Production CLI Transfer Request</span>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy cURL</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
          {curlExample}
        </pre>
      </div>
    </div>
  );
};
