import { NextResponse } from 'next/server';
import { ledger } from '@/lib/ledger-engine';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action, entryId } = body;

    if (action === 'tamper') {
      const res = ledger.tamperLedgerEntry(entryId);
      return NextResponse.json({
        success: true,
        tampered: true,
        data: res,
        audit: ledger.auditSystem(),
        ledgerEntries: ledger.getLedgerEntries(),
      });
    }

    if (action === 'heal') {
      const res = ledger.healLedgerChain();
      return NextResponse.json({
        success: true,
        healed: true,
        data: res,
        audit: ledger.auditSystem(),
        ledgerEntries: ledger.getLedgerEntries(),
      });
    }

    return NextResponse.json({ error: 'Invalid action. Must be "tamper" or "heal"' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
