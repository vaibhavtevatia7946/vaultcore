import { NextResponse } from 'next/server';
import { ledger } from '@/lib/ledger-engine';
import { ConcurrencySimulationResult } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const concurrencyCount = Math.min(Math.max(Number(body.concurrencyCount) || 30, 5), 100);
    const amountPerTransfer = Number(body.amountPerTransfer) || 250.00;
    const bypassLocks = Boolean(body.bypassLocks); // If true, intentionally demonstrates dirty-reads & race conditions
    
    // Allow dynamic account selection, default to Aarav & Priya
    const primaryAccount = body.sourceAccountId || 'acc_aarav';
    const secondaryAccount = body.destinationAccountId || 'acc_priya';

    const startTime = performance.now();
    const logs: string[] = [];
    logs.push(`[INIT] Spawning ${concurrencyCount} parallel UPI settlement workers...`);
    logs.push(
      `[SETUP] Mode: ${
        bypassLocks
          ? 'UNSAFE (Lock Ordering Bypassed - High Risk of Deadlock & Dirty Reads)'
          : 'VAULTCORE PROTECTED (Dijkstra Resource Ordering + Row-Level Locks)'
      }`
    );
    logs.push(`[PAIRS] Cross-transfers between ${primaryAccount} and ${secondaryAccount}`);

    // Generate concurrent requests: half Primary -> Secondary, half Secondary -> Primary
    // This is the classic bidirectional cross-transfer pattern that triggers Coffman's Circular Wait Deadlock
    const promises: Promise<{ success: boolean; error?: string; txId?: string; latency: number }>[] = [];

    for (let i = 0; i < concurrencyCount; i++) {
      const isEven = i % 2 === 0;
      const source = isEven ? primaryAccount : secondaryAccount;
      const destination = isEven ? secondaryAccount : primaryAccount;
      const key = `RRN_SIM_${Date.now()}_worker_${i}_${Math.random().toString(36).substring(2, 6)}`;

      const workerPromise = (async () => {
        const workerStart = performance.now();
        try {
          const res = await ledger.executeTransfer({
            sourceAccountId: source,
            destinationAccountId: destination,
            amount: amountPerTransfer,
            idempotencyKey: key,
            description: `Concurrent UPI Split #${i + 1}`,
            simulatedLatencyMs: Math.floor(Math.random() * 8) + 2, // 2-10ms simulated CBS latency
            bypassLocksForDemo: bypassLocks,
          });
          const latency = Number((performance.now() - workerStart).toFixed(2));
          return { success: true, txId: res.transaction.id, latency };
        } catch (err: any) {
          const latency = Number((performance.now() - workerStart).toFixed(2));
          return { success: false, error: err.message, latency };
        }
      })();

      promises.push(workerPromise);
    }

    const settled = await Promise.all(promises);
    const totalExecutionTimeMs = Number((performance.now() - startTime).toFixed(2));

    let successfulTransfers = 0;
    let rejectedTransfers = 0;
    let totalLatency = 0;
    const latencies: number[] = [];

    settled.forEach((res, idx) => {
      totalLatency += res.latency;
      latencies.push(res.latency);
      if (res.success) {
        successfulTransfers++;
        if (idx < 4) {
          logs.push(`[WORKER #${idx + 1} SETTLED] Txn: ${res.txId?.replace('upi_', '')} in ${res.latency}ms`);
        }
      } else {
        rejectedTransfers++;
        if (logs.length < 15) {
          logs.push(`[WORKER #${idx + 1} REJECTED] ${res.error}`);
        }
      }
    });

    latencies.sort((a, b) => a - b);
    const p95Index = Math.min(Math.floor(latencies.length * 0.95), latencies.length - 1);
    const p95LatencyMs = latencies[p95Index] || 0;
    const avgLatencyMs = Number((totalLatency / concurrencyCount).toFixed(2));
    const tps = Math.round((successfulTransfers / Math.max(totalExecutionTimeMs / 1000, 0.001)));

    const audit = ledger.auditSystem();

    logs.push(`[COMPLETE] Processed ${concurrencyCount} parallel transfers in ${totalExecutionTimeMs}ms.`);
    logs.push(`[METRICS] Throughput: ~${tps} TPS | Avg Latency: ${avgLatencyMs}ms | P95: ${p95LatencyMs}ms`);
    logs.push(`[AUDIT] Invariant Status: ${audit.systemIntegrityStatus} (Delta: ₹${audit.delta})`);

    const result: ConcurrencySimulationResult = {
      totalRequestsSent: concurrencyCount,
      successfulTransfers,
      rejectedTransfers,
      deadlocksAvoided: bypassLocks ? 0 : concurrencyCount,
      raceConditionDoubleSpendsDetected: bypassLocks && !audit.isBalanced ? 1 : 0,
      totalExecutionTimeMs,
      avgLatencyMs,
      p95LatencyMs,
      tps,
      auditInvariantMaintained: audit.isBalanced,
      logs,
    };

    return NextResponse.json({
      success: true,
      result,
      audit,
      accounts: ledger.getAccounts(),
      recentTransactions: ledger.getTransactions().slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
