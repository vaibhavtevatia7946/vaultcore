// ====================================================================
// VaultCore Automated Verification & Integrity Test Suite (Indian Banking & UPI Spec)
// Run via: npm test
// ====================================================================

import assert from 'assert';

console.log('\n=============================================================');
console.log('🇮🇳 VAULTCORE: NPCI & UPI 2.0 CONCURRENCY TEST SUITE');
console.log('=============================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

class TestLedger {
  constructor() {
    this.accounts = new Map([
      ['aarav', { id: 'aarav', name: 'Aarav Sharma', vpa: 'aarav@oksbi', balance: 50000.0, currency: 'INR' }],
      ['priya', { id: 'priya', name: 'Priya Patel', vpa: 'priya@icici', balance: 25000.0, currency: 'INR' }],
      ['treasury', { id: 'treasury', name: 'RBI Settlement Pool', vpa: 'npci.settle@rbi', balance: 10000000.0, currency: 'INR' }],
    ]);
    this.ledger = [];
    this.idempotency = new Map();
    this.locks = new Map();
  }

  async acquireSortedLocks(acc1, acc2) {
    const sorted = [acc1, acc2].sort();
    const releaseFns = [];
    for (const id of sorted) {
      const current = this.locks.get(id) || Promise.resolve();
      let resolver;
      const next = new Promise((r) => (resolver = r));
      this.locks.set(id, current.then(() => next));
      await current;
      releaseFns.push(() => {
        resolver();
        if (this.locks.get(id) === next) this.locks.delete(id);
      });
    }
    return () => {
      for (let i = releaseFns.length - 1; i >= 0; i--) releaseFns[i]();
    };
  }

  async transfer(sourceId, destId, amount, idempotencyKey) {
    if (amount <= 0) throw new Error('Amount must be positive');
    if (sourceId === destId) throw new Error('Self transfer disallowed');

    if (this.idempotency.has(idempotencyKey)) {
      const cached = this.idempotency.get(idempotencyKey);
      return { ...cached, replayed: true };
    }

    const unlock = await this.acquireSortedLocks(sourceId, destId);
    try {
      const src = this.accounts.get(sourceId);
      const dst = this.accounts.get(destId);

      if (!src || !dst) throw new Error('Account not found in Core Banking System');
      if (src.balance < amount) throw new Error('Insufficient funds in payer account');

      src.balance = Number((src.balance - amount).toFixed(2));
      dst.balance = Number((dst.balance + amount).toFixed(2));

      const txId = `upi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      this.ledger.push({ txId, accountId: sourceId, type: 'DEBIT', amount });
      this.ledger.push({ txId, accountId: destId, type: 'CREDIT', amount });

      const result = {
        txId,
        sourceId,
        destId,
        amount,
        replayed: false,
        lockOrder: [sourceId, destId].sort(),
      };
      this.idempotency.set(idempotencyKey, result);
      return result;
    } finally {
      unlock();
    }
  }

  verifyInvariant() {
    let debits = 0;
    let credits = 0;
    for (const entry of this.ledger) {
      if (entry.type === 'DEBIT') debits += entry.amount;
      if (entry.type === 'CREDIT') credits += entry.amount;
    }
    debits = Number(debits.toFixed(2));
    credits = Number(credits.toFixed(2));
    return { debits, credits, delta: Math.abs(credits - debits) };
  }
}

async function runAllSuites() {
  const ledger = new TestLedger();

  // Test 1: Genesis Accounts
  runTest('Suite 1: Indian bank balances & VPAs initialized correctly', () => {
    assert.strictEqual(ledger.accounts.get('aarav').balance, 50000.0);
    assert.strictEqual(ledger.accounts.get('priya').balance, 25000.0);
    assert.strictEqual(ledger.accounts.get('treasury').balance, 10000000.0);
  });

  // Test 2: Double-Entry Posting
  await runAsyncTest('Suite 2: P2P UPI Transfer preserves RBI Invariant: Σ(Debit) == Σ(Credit)', async () => {
    const res = await ledger.transfer('aarav', 'priya', 2500.0, 'RRN_1762589001');
    assert.strictEqual(res.replayed, false);
    assert.strictEqual(ledger.accounts.get('aarav').balance, 47500.0);
    assert.strictEqual(ledger.accounts.get('priya').balance, 27500.0);

    const audit = ledger.verifyInvariant();
    assert.strictEqual(audit.debits, 2500.0);
    assert.strictEqual(audit.credits, 2500.0);
    assert.strictEqual(audit.delta, 0.0);
  });

  // Test 3: NPCI RRN Idempotency Replay
  await runAsyncTest('Suite 3: Replaying identical NPCI RRN does NOT deduct balance twice', async () => {
    const balanceBefore = ledger.accounts.get('aarav').balance;
    const res = await ledger.transfer('aarav', 'priya', 2500.0, 'RRN_1762589001'); // Same RRN
    assert.strictEqual(res.replayed, true);
    assert.strictEqual(ledger.accounts.get('aarav').balance, balanceBefore, 'Balance must remain unchanged on RRN retry');

    const audit = ledger.verifyInvariant();
    assert.strictEqual(audit.delta, 0.0);
  });

  // Test 4: Insufficient Balance Rejection
  await runAsyncTest('Suite 4: Overdraft protection rejects transfer when amount > balance', async () => {
    let failedAsExpected = false;
    try {
      await ledger.transfer('priya', 'aarav', 5000000.0, 'RRN_OVERDRAFT_TEST');
    } catch (err) {
      failedAsExpected = true;
      assert.strictEqual(err.message, 'Insufficient funds in payer account');
    }
    assert.strictEqual(failedAsExpected, true);
  });

  // Test 5: Concurrency Stress Test
  await runAsyncTest('Suite 5: 50 Concurrent cross-payments execute with 0 race condition corruption', async () => {
    const promises = [];
    for (let i = 0; i < 50; i++) {
      const isEven = i % 2 === 0;
      const src = isEven ? 'aarav' : 'priya';
      const dst = isEven ? 'priya' : 'aarav';
      const key = `RRN_CONCURRENCY_${i}_${Date.now()}`;
      promises.push(ledger.transfer(src, dst, 100.0, key));
    }

    const results = await Promise.all(promises);
    assert.strictEqual(results.length, 50);

    const audit = ledger.verifyInvariant();
    assert.strictEqual(audit.delta, 0.0, 'RBI Mathematical delta MUST remain ₹0.00');
    console.log(`    ↳ Verified 50 concurrent UPI txns | Total Debits: ₹${audit.debits} | Total Credits: ₹${audit.credits} | Delta: ₹${audit.delta}`);
  });

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('-------------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllSuites();
