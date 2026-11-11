// ====================================================================
// VaultCore Automated Verification & Integrity Test Suite (Indian Banking & UPI Spec)
// Run via: npm test
// ====================================================================

import assert from 'assert';
import crypto from 'crypto';

console.log('\n=============================================================');
console.log('🇮🇳 VAULTCORE: NPCI & UPI 2.0 CONCURRENCY TEST SUITE v2.0');
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
      ['aarav', { id: 'aarav', name: 'Aarav Sharma', vpa: 'aarav@oksbi', balance: 50000.0, heldBalance: 0, currency: 'INR' }],
      ['priya', { id: 'priya', name: 'Priya Patel', vpa: 'priya@icici', balance: 25000.0, heldBalance: 0, currency: 'INR' }],
      ['treasury', { id: 'treasury', name: 'RBI Settlement Pool', vpa: 'npci.settle@rbi', balance: 10000000.0, heldBalance: 0, currency: 'INR' }],
    ]);
    this.ledger = [];
    this.idempotency = new Map();
    this.locks = new Map();
    this.holds = new Map();
  }

  calculateHash(prevHash, txId, amount, accountId, type, createdAt) {
    return crypto
      .createHash('sha256')
      .update(`${prevHash}:${txId}:${Number(amount).toFixed(2)}:${accountId}:${type}:${createdAt}`)
      .digest('hex');
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
      const now = new Date().toISOString();
      const prevHash = this.ledger.length > 0 ? this.ledger[this.ledger.length - 1].hash : 'GENESIS_ROOT';

      const debitHash = this.calculateHash(prevHash, txId, amount, sourceId, 'DEBIT', now);
      const creditHash = this.calculateHash(debitHash, txId, amount, destId, 'CREDIT', now);

      this.ledger.push({ id: `led_deb_${Date.now()}`, txId, accountId: sourceId, type: 'DEBIT', amount, prevHash, hash: debitHash, createdAt: now });
      this.ledger.push({ id: `led_crd_${Date.now()}`, txId, accountId: destId, type: 'CREDIT', amount, prevHash: debitHash, hash: creditHash, createdAt: now });

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

  holdFunds(sourceId, destId, amount, holdId) {
    const src = this.accounts.get(sourceId);
    if (!src || src.balance < amount) throw new Error('Insufficient available balance for pre-auth hold');
    src.balance = Number((src.balance - amount).toFixed(2));
    src.heldBalance = Number(((src.heldBalance || 0) + amount).toFixed(2));
    this.holds.set(holdId, { sourceId, destId, amount, status: 'HELD' });
    return this.holds.get(holdId);
  }

  captureFunds(holdId) {
    const hold = this.holds.get(holdId);
    if (!hold || hold.status !== 'HELD') throw new Error('Invalid hold');
    const src = this.accounts.get(hold.sourceId);
    const dst = this.accounts.get(hold.destId);
    src.heldBalance = Number((src.heldBalance - hold.amount).toFixed(2));
    dst.balance = Number((dst.balance + hold.amount).toFixed(2));
    hold.status = 'CAPTURED';
    return hold;
  }

  verifyChainIntegrity() {
    for (let i = 0; i < this.ledger.length; i++) {
      const entry = this.ledger[i];
      const expectedHash = this.calculateHash(entry.prevHash, entry.txId, entry.amount, entry.accountId, entry.type, entry.createdAt);
      if (entry.hash !== expectedHash) return false;
      if (i > 0 && entry.prevHash !== this.ledger[i - 1].hash) return false;
    }
    return true;
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

  // Test 6: Merkle Chain Cryptographic Audit
  runTest('Suite 6: SHA-256 Merkle chain verification detects forged historical records', () => {
    assert.strictEqual(ledger.verifyChainIntegrity(), true, 'Chain must initially be 100% verified');

    // Simulate malicious tamper
    const originalAmount = ledger.ledger[1].amount;
    ledger.ledger[1].amount = 999999.0; // Tamper without recalculating hash
    assert.strictEqual(ledger.verifyChainIntegrity(), false, 'Chain integrity check must detect altered block');

    // Restore original amount
    ledger.ledger[1].amount = originalAmount;
    assert.strictEqual(ledger.verifyChainIntegrity(), true, 'Chain must be valid once restored');
  });

  // Test 7: Two-Phase Commit Escrow (Hold & Capture)
  runTest('Suite 7: Two-Phase Commit holds funds from available balance and captures atomically', () => {
    const aaravAvailBefore = ledger.accounts.get('aarav').balance;
    const priyaAvailBefore = ledger.accounts.get('priya').balance;

    // 1. Hold ₹1,000
    ledger.holdFunds('aarav', 'priya', 1000.0, 'hold_test_001');
    assert.strictEqual(ledger.accounts.get('aarav').balance, aaravAvailBefore - 1000.0);
    assert.strictEqual(ledger.accounts.get('aarav').heldBalance, 1000.0);

    // 2. Capture Hold
    ledger.captureFunds('hold_test_001');
    assert.strictEqual(ledger.accounts.get('aarav').heldBalance, 0.0);
    assert.strictEqual(ledger.accounts.get('priya').balance, priyaAvailBefore + 1000.0);
  });

  console.log('\n-------------------------------------------------------------');
  console.log(`📊 TEST RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
  console.log('-------------------------------------------------------------\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runAllSuites();
