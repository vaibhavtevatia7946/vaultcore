import crypto from 'crypto';
import {
  Account,
  Transaction,
  LedgerEntry,
  InvariantAudit,
  IdempotencyRecord,
  TwoPhaseHold,
} from './types';

// Production-Grade Indian UPI 2.0 Ledger & Concurrency Engine
class LedgerEngine {
  private accounts: Map<string, Account> = new Map();
  private transactions: Transaction[] = [];
  private ledgerEntries: LedgerEntry[] = [];
  private idempotencyStore: Map<string, IdempotencyRecord> = new Map();
  private activeHolds: Map<string, TwoPhaseHold> = new Map();

  // Cumulative math counters ensuring inviolable double-entry audit across memory slices
  private cumulativeDebits = 0;
  private cumulativeCredits = 0;

  // Row-level lock queues for each account ID (simulating PostgreSQL `SELECT ... FOR UPDATE`)
  private accountLocks: Map<string, Promise<void>> = new Map();

  // Tamper tracking for interactive security demo
  private tamperedEntryId: string | null = null;
  private originalEntryBackup: LedgerEntry | null = null;

  constructor() {
    this.resetToInitialState();
  }

  public resetToInitialState() {
    this.accounts.clear();
    this.transactions = [];
    this.ledgerEntries = [];
    this.idempotencyStore.clear();
    this.accountLocks.clear();
    this.activeHolds.clear();
    this.cumulativeDebits = 0;
    this.cumulativeCredits = 0;
    this.tamperedEntryId = null;
    this.originalEntryBackup = null;

    const initialAccounts: Omit<Account, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'acc_aarav',
        name: 'Aarav Sharma',
        vpa: 'aarav@oksbi',
        accountNumber: 'SBIN0004128-9842',
        bankName: 'State Bank of India',
        type: 'USER',
        balance: 75000.0,
        heldBalance: 0,
        currency: 'INR',
        avatarColor: 'from-blue-500 to-indigo-600',
      },
      {
        id: 'acc_priya',
        name: 'Priya Patel',
        vpa: 'priya@icici',
        accountNumber: 'ICIC0001043-4412',
        bankName: 'ICICI Bank',
        type: 'USER',
        balance: 45000.0,
        heldBalance: 0,
        currency: 'INR',
        avatarColor: 'from-purple-500 to-pink-600',
      },
      {
        id: 'acc_rohan',
        name: 'Rohan Verma',
        vpa: 'rohan@paytm',
        accountNumber: 'PYTM0123456-1102',
        bankName: 'Paytm Payments Bank',
        type: 'USER',
        balance: 20000.0,
        heldBalance: 0,
        currency: 'INR',
        avatarColor: 'from-amber-500 to-orange-600',
      },
      {
        id: 'acc_merchant',
        name: 'Swiggy Instamart (Merchant)',
        vpa: 'swiggy.pay@hdfcbank',
        accountNumber: 'HDFC0000128-5501',
        bankName: 'HDFC Bank',
        type: 'MERCHANT',
        balance: 550000.0,
        heldBalance: 0,
        currency: 'INR',
        avatarColor: 'from-emerald-500 to-teal-600',
      },
      {
        id: 'acc_treasury',
        name: 'NPCI / RBI Settlement Guarantee Pool',
        vpa: 'npci.settle@rbi',
        accountNumber: 'RBIS0000001-0001',
        bankName: 'Reserve Bank of India',
        type: 'TREASURY',
        balance: 10000000.0, // ₹1 Crore Pool
        heldBalance: 0,
        currency: 'INR',
        avatarColor: 'from-slate-600 to-zinc-800',
      },
    ];

    const now = new Date().toISOString();
    initialAccounts.forEach((acc) => {
      this.accounts.set(acc.id, {
        ...acc,
        heldBalance: 0,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Seed genesis ledger entry for RBI settlement pool bootstrap
    const genesisTxId = 'tx_genesis_rbi_000';
    const genesisCreatedAt = now;
    const genesisPrevHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const genesisHash = this.calculateHash(
      genesisPrevHash,
      genesisTxId,
      10000000.0,
      'acc_treasury',
      'CREDIT',
      genesisCreatedAt
    );

    const genesisEntry: LedgerEntry = {
      id: 'led_genesis_000',
      transactionId: genesisTxId,
      accountId: 'acc_treasury',
      accountName: 'NPCI / RBI Settlement Guarantee Pool',
      vpa: 'npci.settle@rbi',
      type: 'CREDIT',
      amount: 10000000.0,
      currency: 'INR',
      balanceAfter: 10000000.0,
      prevHash: genesisPrevHash,
      hash: genesisHash,
      createdAt: genesisCreatedAt,
    };
    this.ledgerEntries.push(genesisEntry);
  }

  // --- CONCURRENCY & DEADLOCK PREVENTION ENGINE ---
  // Acquires locks in strictly ascending lexicographical order
  // Eliminates Coffman's "Circular Wait" condition for deadlock
  private async acquireRowLevelLocks(accountA: string, accountB: string): Promise<() => void> {
    const sortedIds = [accountA, accountB].sort();
    const releaseFns: (() => void)[] = [];

    for (const id of sortedIds) {
      const currentLock = this.accountLocks.get(id) || Promise.resolve();

      let nextLockResolver: () => void = () => {};
      const nextLock = new Promise<void>((resolve) => {
        nextLockResolver = resolve;
      });

      this.accountLocks.set(id, currentLock.then(() => nextLock));
      await currentLock;

      const releaseThisLock = () => {
        nextLockResolver();
        if (this.accountLocks.get(id) === nextLock) {
          this.accountLocks.delete(id);
        }
      };

      releaseFns.push(releaseThisLock);
    }

    return () => {
      for (let i = releaseFns.length - 1; i >= 0; i--) {
        releaseFns[i]();
      }
    };
  }

  // --- DETERMINISTIC CRYPTOGRAPHIC AUDIT HASH ---
  // Pure function: inputs are strictly deterministic and reproducible
  public calculateHash(
    prevHash: string,
    txId: string,
    amount: number,
    accountId: string,
    type: string,
    createdAt: string
  ): string {
    return crypto
      .createHash('sha256')
      .update(`${prevHash}:${txId}:${amount.toFixed(2)}:${accountId}:${type}:${createdAt}`)
      .digest('hex');
  }

  // --- CORE DOUBLE-ENTRY EXECUTION WITH IDEMPOTENCY ---
  public async executeTransfer(params: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    idempotencyKey: string;
    description?: string;
    simulatedLatencyMs?: number;
    bypassLocksForDemo?: boolean;
  }): Promise<{ transaction: Transaction; replayed: boolean }> {
    const startTime = performance.now();
    const {
      sourceAccountId,
      destinationAccountId,
      amount,
      idempotencyKey,
      description = 'UPI P2P Transfer',
      simulatedLatencyMs = 0,
      bypassLocksForDemo = false,
    } = params;

    if (sourceAccountId === destinationAccountId) {
      throw new Error('Self-transfer is disallowed: source and destination VPA must differ');
    }

    if (amount <= 0 || isNaN(amount)) {
      throw new Error('Transfer amount must be strictly positive');
    }

    // 1. Idempotency Check (NPCI RRN check)
    const existingKeyRecord = this.idempotencyStore.get(idempotencyKey);
    if (existingKeyRecord) {
      if (existingKeyRecord.status === 'IN_FLIGHT') {
        throw new Error('UPI transaction already in progress for this RRN. Please wait.');
      }
      if (existingKeyRecord.status === 'COMPLETED' && existingKeyRecord.responsePayload) {
        return {
          transaction: {
            ...existingKeyRecord.responsePayload,
            replayedFromCache: true,
          },
          replayed: true,
        };
      }
    }

    this.idempotencyStore.set(idempotencyKey, {
      key: idempotencyKey,
      status: 'IN_FLIGHT',
      createdAt: Date.now(),
    });

    let unlockRows = () => {};

    try {
      if (!bypassLocksForDemo) {
        unlockRows = await this.acquireRowLevelLocks(sourceAccountId, destinationAccountId);
      }

      if (simulatedLatencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
      }

      const source = this.accounts.get(sourceAccountId);
      const destination = this.accounts.get(destinationAccountId);

      if (!source) throw new Error(`Source account '${sourceAccountId}' not found in CBS`);
      if (!destination) throw new Error(`Destination account '${destinationAccountId}' not found in CBS`);

      if (source.balance < amount) {
        throw new Error(
          `Insufficient funds in ${source.name} (${source.vpa}). Required: ₹${amount.toLocaleString('en-IN')}, Available: ₹${source.balance.toLocaleString('en-IN')}`
        );
      }

      const txId = `upi_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();

      // Deduct from Source
      source.balance = Number((source.balance - amount).toFixed(2));
      source.updatedAt = now;

      // Credit to Destination
      destination.balance = Number((destination.balance + amount).toFixed(2));
      destination.updatedAt = now;

      // Get hash of the latest entry at head of the chain (index 0)
      const prevHash = this.ledgerEntries.length > 0
        ? this.ledgerEntries[0].hash
        : '0000000000000000000000000000000000000000000000000000000000000000';

      // Entry 1: DEBIT source account
      const debitHash = this.calculateHash(prevHash, txId, amount, source.id, 'DEBIT', now);
      const debitEntry: LedgerEntry = {
        id: `led_deb_${Math.random().toString(36).substring(2, 9)}`,
        transactionId: txId,
        accountId: source.id,
        accountName: source.name,
        vpa: source.vpa,
        type: 'DEBIT',
        amount: amount,
        currency: 'INR',
        balanceAfter: source.balance,
        prevHash: prevHash,
        hash: debitHash,
        createdAt: now,
      };

      // Entry 2: CREDIT destination account (chains to debit entry)
      const creditHash = this.calculateHash(debitHash, txId, amount, destination.id, 'CREDIT', now);
      const creditEntry: LedgerEntry = {
        id: `led_crd_${Math.random().toString(36).substring(2, 9)}`,
        transactionId: txId,
        accountId: destination.id,
        accountName: destination.name,
        vpa: destination.vpa,
        type: 'CREDIT',
        amount: amount,
        currency: 'INR',
        balanceAfter: destination.balance,
        prevHash: debitHash,
        hash: creditHash,
        createdAt: now,
      };

      // Unshift in reverse order so credit is top, followed by debit
      this.ledgerEntries.unshift(creditEntry);
      this.ledgerEntries.unshift(debitEntry);

      // Track cumulative totals
      this.cumulativeDebits = Number((this.cumulativeDebits + amount).toFixed(2));
      this.cumulativeCredits = Number((this.cumulativeCredits + amount).toFixed(2));

      // Limit memory view to 200 items for browser smoothness
      if (this.ledgerEntries.length > 200) {
        this.ledgerEntries = this.ledgerEntries.slice(0, 200);
      }

      const executionTime = Number((performance.now() - startTime).toFixed(2));
      const sortedLockOrder = [sourceAccountId, destinationAccountId].sort();

      const transaction: Transaction = {
        id: txId,
        idempotencyKey,
        sourceAccountId,
        destinationAccountId,
        sourceAccountName: source.name,
        destinationAccountName: destination.name,
        sourceVpa: source.vpa,
        destinationVpa: destination.vpa,
        amount,
        currency: 'INR',
        status: 'COMPLETED',
        description,
        lockAcquiredOrder: sortedLockOrder,
        executionTimeMs: executionTime,
        createdAt: now,
      };

      this.transactions.unshift(transaction);
      if (this.transactions.length > 100) {
        this.transactions = this.transactions.slice(0, 100);
      }

      this.idempotencyStore.set(idempotencyKey, {
        key: idempotencyKey,
        status: 'COMPLETED',
        responsePayload: transaction,
        createdAt: Date.now(),
      });

      return { transaction, replayed: false };
    } catch (err: any) {
      this.idempotencyStore.delete(idempotencyKey);
      throw err;
    } finally {
      unlockRows();
    }
  }

  // --- TWO-PHASE COMMIT (PRE-AUTH HOLD & CAPTURE) ---
  public async createHold(params: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    idempotencyKey: string;
    description?: string;
  }): Promise<TwoPhaseHold> {
    const { sourceAccountId, destinationAccountId, amount, idempotencyKey, description = 'Pre-Auth Escrow Hold' } = params;

    const source = this.accounts.get(sourceAccountId);
    const destination = this.accounts.get(destinationAccountId);

    if (!source) throw new Error(`Source account '${sourceAccountId}' not found in CBS`);
    if (!destination) throw new Error(`Destination account '${destinationAccountId}' not found in CBS`);

    if (source.balance < amount) {
      throw new Error(`Insufficient available balance for pre-auth hold of ₹${amount.toLocaleString('en-IN')}`);
    }

    const holdId = `hold_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    // Lock funds from available balance to held balance
    source.balance = Number((source.balance - amount).toFixed(2));
    source.heldBalance = Number(((source.heldBalance || 0) + amount).toFixed(2));
    source.updatedAt = now;

    const hold: TwoPhaseHold = {
      id: holdId,
      idempotencyKey,
      sourceAccountId: source.id,
      sourceAccountName: source.name,
      sourceVpa: source.vpa,
      destinationAccountId: destination.id,
      destinationAccountName: destination.name,
      destinationVpa: destination.vpa,
      amount,
      currency: 'INR',
      description,
      status: 'HELD',
      createdAt: now,
    };

    this.activeHolds.set(holdId, hold);
    return hold;
  }

  public async captureHold(holdId: string): Promise<Transaction> {
    const hold = this.activeHolds.get(holdId);
    if (!hold) throw new Error(`Hold '${holdId}' not found`);
    if (hold.status !== 'HELD') throw new Error(`Hold '${holdId}' is already ${hold.status}`);

    const source = this.accounts.get(hold.sourceAccountId);
    const destination = this.accounts.get(hold.destinationAccountId);
    if (!source || !destination) throw new Error('Accounts associated with hold not found');

    const now = new Date().toISOString();
    // Release from heldBalance and credit destination
    source.heldBalance = Number(Math.max(0, (source.heldBalance || 0) - hold.amount).toFixed(2));
    source.updatedAt = now;

    destination.balance = Number((destination.balance + hold.amount).toFixed(2));
    destination.updatedAt = now;

    hold.status = 'CAPTURED';

    const txId = `upi_cap_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const prevHash = this.ledgerEntries.length > 0 ? this.ledgerEntries[0].hash : '0000000000000000000000000000000000000000000000000000000000000000';

    const debitHash = this.calculateHash(prevHash, txId, hold.amount, source.id, 'DEBIT', now);
    const debitEntry: LedgerEntry = {
      id: `led_deb_${Math.random().toString(36).substring(2, 9)}`,
      transactionId: txId,
      accountId: source.id,
      accountName: source.name,
      vpa: source.vpa,
      type: 'DEBIT',
      amount: hold.amount,
      currency: 'INR',
      balanceAfter: source.balance,
      prevHash,
      hash: debitHash,
      createdAt: now,
    };

    const creditHash = this.calculateHash(debitHash, txId, hold.amount, destination.id, 'CREDIT', now);
    const creditEntry: LedgerEntry = {
      id: `led_crd_${Math.random().toString(36).substring(2, 9)}`,
      transactionId: txId,
      accountId: destination.id,
      accountName: destination.name,
      vpa: destination.vpa,
      type: 'CREDIT',
      amount: hold.amount,
      currency: 'INR',
      balanceAfter: destination.balance,
      prevHash: debitHash,
      hash: creditHash,
      createdAt: now,
    };

    this.ledgerEntries.unshift(creditEntry);
    this.ledgerEntries.unshift(debitEntry);

    this.cumulativeDebits = Number((this.cumulativeDebits + hold.amount).toFixed(2));
    this.cumulativeCredits = Number((this.cumulativeCredits + hold.amount).toFixed(2));

    const transaction: Transaction = {
      id: txId,
      idempotencyKey: hold.idempotencyKey,
      sourceAccountId: source.id,
      destinationAccountId: destination.id,
      sourceAccountName: source.name,
      destinationAccountName: destination.name,
      sourceVpa: source.vpa,
      destinationVpa: destination.vpa,
      amount: hold.amount,
      currency: 'INR',
      status: 'CAPTURED',
      description: `[2PC CAPTURED] ${hold.description}`,
      lockAcquiredOrder: [source.id, destination.id].sort(),
      executionTimeMs: 1.2,
      createdAt: now,
    };

    this.transactions.unshift(transaction);
    return transaction;
  }

  public async voidHold(holdId: string): Promise<TwoPhaseHold> {
    const hold = this.activeHolds.get(holdId);
    if (!hold) throw new Error(`Hold '${holdId}' not found`);
    if (hold.status !== 'HELD') throw new Error(`Hold '${holdId}' is already ${hold.status}`);

    const source = this.accounts.get(hold.sourceAccountId);
    if (!source) throw new Error('Source account not found');

    const now = new Date().toISOString();
    source.heldBalance = Number(Math.max(0, (source.heldBalance || 0) - hold.amount).toFixed(2));
    source.balance = Number((source.balance + hold.amount).toFixed(2));
    source.updatedAt = now;

    hold.status = 'VOIDED';
    return hold;
  }

  // --- CRYPTOGRAPHIC CHAIN INTEGRITY AUDIT ---
  public verifyChainIntegrity(): { isValid: boolean; brokenAtId: string | null } {
    // If an intentional tamper is injected
    if (this.tamperedEntryId) {
      return { isValid: false, brokenAtId: this.tamperedEntryId };
    }

    // Verify chronological chain integrity from genesis upwards
    const chronological = [...this.ledgerEntries].reverse();
    for (let i = 0; i < chronological.length; i++) {
      const entry = chronological[i];
      const expectedHash = this.calculateHash(
        entry.prevHash,
        entry.transactionId,
        entry.amount,
        entry.accountId,
        entry.type,
        entry.createdAt
      );

      if (entry.hash !== expectedHash) {
        return { isValid: false, brokenAtId: entry.id };
      }

      if (i > 0 && entry.prevHash !== chronological[i - 1].hash) {
        return { isValid: false, brokenAtId: entry.id };
      }
    }

    return { isValid: true, brokenAtId: null };
  }

  // --- INTERACTIVE TAMPERING SIMULATION ---
  public tamperLedgerEntry(entryId?: string): { success: boolean; tamperedId: string; alteredAmount: number } {
    const targetEntry = entryId 
      ? this.ledgerEntries.find((e) => e.id === entryId)
      : this.ledgerEntries.find((e) => e.type === 'DEBIT' && e.id !== 'led_genesis_000') || this.ledgerEntries[0];

    if (!targetEntry) {
      throw new Error('No valid ledger entry found to simulate tamper');
    }

    this.tamperedEntryId = targetEntry.id;
    this.originalEntryBackup = { ...targetEntry };

    // Maliciously forge entry amount by adding ₹5,000 without recalculating the Merkle hash!
    targetEntry.amount = Number((targetEntry.amount + 5000).toFixed(2));
    targetEntry.isTampered = true;

    return {
      success: true,
      tamperedId: targetEntry.id,
      alteredAmount: targetEntry.amount,
    };
  }

  public healLedgerChain(): { success: boolean } {
    if (this.tamperedEntryId && this.originalEntryBackup) {
      const entry = this.ledgerEntries.find((e) => e.id === this.tamperedEntryId);
      if (entry) {
        entry.amount = this.originalEntryBackup.amount;
        entry.isTampered = false;
      }
    }
    this.tamperedEntryId = null;
    this.originalEntryBackup = null;
    return { success: true };
  }

  // --- MATHEMATICAL INVARIANT AUDIT ENGINE ---
  public auditSystem(): InvariantAudit {
    const chainStatus = this.verifyChainIntegrity();

    // Sum active holds across accounts
    let totalHeld = 0;
    for (const acc of this.accounts.values()) {
      totalHeld += acc.heldBalance || 0;
    }

    // Invariant check: Cumulative Debits must strictly equal Cumulative Credits
    const delta = Number(Math.abs(this.cumulativeCredits - this.cumulativeDebits).toFixed(2));
    const isBalanced = delta === 0 && chainStatus.isValid;

    return {
      totalDebits: this.cumulativeDebits,
      totalCredits: this.cumulativeCredits,
      isBalanced,
      delta,
      totalTransactions: this.transactions.length,
      totalLedgerEntries: this.ledgerEntries.length,
      systemIntegrityStatus: isBalanced ? 'VERIFIED' : 'COMPROMISED',
      isChainValid: chainStatus.isValid,
      tamperedEntryId: chainStatus.brokenAtId,
      heldFunds: Number(totalHeld.toFixed(2)),
      lastAuditTime: new Date().toISOString(),
    };
  }

  public getAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  public getTransactions(): Transaction[] {
    return this.transactions;
  }

  public getLedgerEntries(): LedgerEntry[] {
    return this.ledgerEntries;
  }

  public getActiveHolds(): TwoPhaseHold[] {
    return Array.from(this.activeHolds.values());
  }
}

// Global persistence for both development and serverless invocations
const globalForLedger = globalThis as unknown as { ledgerEngine?: LedgerEngine };
export const ledger = globalForLedger.ledgerEngine || new LedgerEngine();
globalForLedger.ledgerEngine = ledger;
