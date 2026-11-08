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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Intro Heading */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-bold text-white tracking-tight">NPCI & UPI 2.0 Architectural Specification</h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          VaultCore models the core banking infrastructure behind modern Indian FinTech giants (PhonePe, Razorpay, Paytm, CRED). It enforces RBI-mandated double-entry auditability, NPCI RRN idempotency, and deadlock-free high-frequency settlement.
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
              <h3 className="text-sm font-semibold text-white">RBI Core Banking Double-Entry</h3>
              <span className="text-[10px] font-mono text-blue-400">Zero Balance Drift Theorem</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every UPI transaction generates two immutable ledger rows: 1 DEBIT from the payer bank and 1 CREDIT to the beneficiary bank. The fundamental banking equation is verified continuously: <span className="font-mono text-emerald-400 font-semibold">Σ(Credits) - Σ(Debits) ≡ ₹0.00</span>.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Deadlock-Free Resource Ordering</h3>
              <span className="text-[10px] font-mono text-purple-400">NPCI Cross-Payment Resolution</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            When users transfer to each other simultaneously, circular deadlocks are prevented by sorting bank account IDs lexicographically before acquiring row locks (`min(ID_A, ID_B)` first).
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="fintech-gradient-border rounded-2xl p-5 space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">NPCI RRN Idempotency Guard</h3>
              <span className="text-[10px] font-mono text-amber-400">Zero Duplicate Debits on Network Retries</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every UPI request passes an RRN (Retrieval Reference Number). In-flight requests lock the RRN; completed payments return the original settlement payload with <span className="font-mono text-slate-300">X-Idempotent-Replay: true</span> without repeated bank balance deductions.
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
              <span className="text-[10px] font-mono text-emerald-400">SHA-256 Merkle Chain Integrity</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every transaction writes a cryptographic hash incorporating the prior record hash, amount, and account balances. Any post-settlement database alteration immediately invalidates the entire audit chain.
          </p>
        </div>
      </div>

      {/* Terminal cURL Tester Box */}
      <div className="rounded-2xl bg-[#06070a] border border-white/10 p-5 space-y-3 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-white">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Direct API Invocation (cURL to Live Vercel Endpoint)</span>
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
