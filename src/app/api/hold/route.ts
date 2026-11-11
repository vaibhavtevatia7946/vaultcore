import { NextResponse } from 'next/server';
import { ledger } from '@/lib/ledger-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, sourceAccountId, destinationAccountId, amount, description, holdId } = body;

    if (action === 'create') {
      const idempotencyKey = req.headers.get('Idempotency-Key') || `HOLD_RRN_${Date.now()}`;
      const hold = await ledger.createHold({
        sourceAccountId,
        destinationAccountId,
        amount: Number(amount),
        idempotencyKey,
        description,
      });

      return NextResponse.json({
        success: true,
        action: 'create',
        hold,
        accounts: ledger.getAccounts(),
        activeHolds: ledger.getActiveHolds(),
        audit: ledger.auditSystem(),
      });
    }

    if (action === 'capture') {
      if (!holdId) {
        return NextResponse.json({ error: 'Missing required parameter: holdId' }, { status: 400 });
      }
      const transaction = await ledger.captureHold(holdId);
      return NextResponse.json({
        success: true,
        action: 'capture',
        transaction,
        accounts: ledger.getAccounts(),
        activeHolds: ledger.getActiveHolds(),
        audit: ledger.auditSystem(),
      });
    }

    if (action === 'void') {
      if (!holdId) {
        return NextResponse.json({ error: 'Missing required parameter: holdId' }, { status: 400 });
      }
      const voidedHold = await ledger.voidHold(holdId);
      return NextResponse.json({
        success: true,
        action: 'void',
        hold: voidedHold,
        accounts: ledger.getAccounts(),
        activeHolds: ledger.getActiveHolds(),
        audit: ledger.auditSystem(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Supported: create, capture, void' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Hold operation failed' },
      { status: 422 }
    );
  }
}
