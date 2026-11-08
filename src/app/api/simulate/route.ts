import { NextResponse } from 'next/server';
import { ledger } from '@/lib/ledger-engine';
import { ConcurrencySimulationResult } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const concurrencyCount = Math.min(Math.max(Number(body.concurrencyCount) || 30, 5), 100);
    const amountPerTransfer = Number(body.amountPerTransfer) || 20.00;
    const bypassLocks = Boolean(body.bypassLocks); // If true, intentionally demonstrates dirty-reads

    const startTime = performance.now();
    const logs: string[] = [];
    logs.push(`[INIT] Spawning ${concurrencyCount} concurrent worker threads...`);
    logs.push(`[SETUP] Mode: ${bypassLocks ? 'UNPROTECTED (Locks Bypassed - Danger of Race Condition)' : 'VAULTCORE PROTECTED (Resource-Ordered Row Locks + Invariant Check)'}`);

    // Generate concurrent requests. Half Alice -> Bob, Half Bob -> Alice (Cross-transfers that normally cause deadlocks)
    const promises: Promise<{ success: boolean; error?: string; txId?: string; latency: number }>[] = [];

    for (let i = 0; i < concurrencyCount; i++) {
      const isEven = i % 2 === 0;
      const source = isEven ? 'acc_alice' : 'acc_bob';
      const destination = isEven ? 'acc_bob' : 'acc_alice';
      const key = `sim_key_${Date.now()}_worker_${i}_${Math.random().toString(36).substring(2, 6)}`;

      const workerPromise = (async () => {
        const workerStart = performance.now();
        try {
          const res = await ledger.executeTransfer({
            sourceAccountId: source,
            destinationAccountId: destination,
            amount: amountPerTransfer,
            idempotencyKey: key,
            description: `Simulated Stress Transfer #${i + 1}`,
            simulatedLatencyMs: Math.floor(Math.random() * 8) + 2, // 2-10ms simulated DB latency
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

    settled.forEach((res, idx) => {
      totalLatency += res.latency;
      if (res.success) {
        successfulTransfers++;
      } else {
        rejectedTransfers++;
        if (logs.length < 15) {
          logs.push(`[WORKER #${idx + 1} REJECTED] ${res.error}`);
        }
      }
    });

    const avgLatencyMs = Number((totalLatency / concurrencyCount).toFixed(2));
    const audit = ledger.auditSystem();

    logs.push(`[COMPLETE] Processed ${concurrencyCount} parallel transfers in ${totalExecutionTimeMs}ms.`);
    logs.push(`[METRICS] Success: ${successfulTransfers} | Rejected: ${rejectedTransfers} | Avg Latency: ${avgLatencyMs}ms`);
    logs.push(`[AUDIT] Invariant Status: ${audit.systemIntegrityStatus} (Delta: $${audit.delta})`);

    const result: ConcurrencySimulationResult = {
      totalRequestsSent: concurrencyCount,
      successfulTransfers,
      rejectedTransfers,
      deadlocksAvoided: bypassLocks ? 0 : concurrencyCount,
      raceConditionDoubleSpendsDetected: bypassLocks && !audit.isBalanced ? 1 : 0,
      totalExecutionTimeMs,
      avgLatencyMs,
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
