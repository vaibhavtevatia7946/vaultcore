import { NextResponse } from 'next/server';
import { ledger } from '@/lib/ledger-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idempotencyHeader = req.headers.get('Idempotency-Key') || body.idempotencyKey;

    if (!idempotencyHeader) {
      return NextResponse.json(
        { error: 'Header `Idempotency-Key` or body parameter `idempotencyKey` is mandatory for safe financial operations' },
        { status: 400 }
      );
    }

    const { sourceAccountId, destinationAccountId, amount, description, simulatedLatencyMs } = body;

    if (!sourceAccountId || !destinationAccountId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters: sourceAccountId, destinationAccountId, amount' },
        { status: 400 }
      );
    }

    const result = await ledger.executeTransfer({
      sourceAccountId,
      destinationAccountId,
      amount: Number(amount),
      idempotencyKey: idempotencyHeader,
      description,
      simulatedLatencyMs: simulatedLatencyMs ? Number(simulatedLatencyMs) : 0,
      bypassLocksForDemo: false,
    });

    return NextResponse.json(
      {
        success: true,
        data: result.transaction,
        replayedFromCache: result.replayed,
        audit: ledger.auditSystem(),
      },
      {
        status: 200,
        headers: {
          'X-Idempotent-Replay': result.replayed ? 'true' : 'false',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Transfer failed' },
      { status: 422 }
    );
  }
}
