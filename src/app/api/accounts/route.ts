import { NextResponse } from 'next/server';
import { ledger } from '@/lib/ledger-engine';

export async function GET() {
  try {
    const accounts = ledger.getAccounts();
    const transactions = ledger.getTransactions();
    const ledgerEntries = ledger.getLedgerEntries();
    const audit = ledger.auditSystem();

    return NextResponse.json({
      accounts,
      transactions,
      ledgerEntries,
      audit,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.action === 'reset') {
      ledger.resetToInitialState();
      return NextResponse.json({ message: 'State successfully reset to genesis snapshot' });
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
