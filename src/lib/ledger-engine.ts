import crypto from 'crypto';
import { Account, Transaction, LedgerEntry, InvariantAudit, IdempotencyRecord } from './types';

// In-Memory Production-Grade State Store (Simulates PostgreSQL with strict ACID transactions)
class LedgerEngine {
  private accounts: Map<string, Account> = new Map();
  private transactions: Transaction[] = [];
  private ledgerEntries: LedgerEntry[] = [];
  private idempotencyStore: Map<string, IdempotencyRecord> = new Map();
  
  // Row-level lock queues for each account ID (simulating PostgreSQL `SELECT ... FOR UPDATE`)
  private accountLocks: Map<string, Promise<void>> = new Map();

  constructor() {
    this.resetToInitialState();
  }

  public resetToInitialState() {
    this.accounts.clear();
    this.transactions = [];
    this.ledgerEntries = [];
    this.idempotencyStore.clear();
    this.accountLocks.clear();

    const initialAccounts: Omit<Account, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'acc_alice',
        name: 'Alice Cooper',
        accountNumber: 'VAULT-001042',
        type: 'USER',
        balance: 10000.00,
        currency: 'USD',
        avatarColor: 'from-blue-500 to-indigo-600',
      },
      {
        id: 'acc_bob',
        name: 'Bob Martinez',
        accountNumber: 'VAULT-001043',
        type: 'USER',
        balance: 5000.00,
        currency: 'USD',
        avatarColor: 'from-purple-500 to-pink-600',
      },
      {
        id: 'acc_charlie',
        name: 'Charlie Zhang',
        accountNumber: 'VAULT-001044',
        type: 'USER',
        balance: 2500.00,
        currency: 'USD',
        avatarColor: 'from-amber-500 to-orange-600',
      },
      {
        id: 'acc_merchant',
        name: 'Apex Cloud Solutions (Merchant)',
        accountNumber: 'VAULT-990001',
        type: 'MERCHANT',
        balance: 75000.00,
        currency: 'USD',
        avatarColor: 'from-emerald-500 to-teal-600',
      },
      {
        id: 'acc_treasury',
        name: 'Reserve Central Treasury',
        accountNumber: 'VAULT-000001',
        type: 'TREASURY',
        balance: 1000000.00,
        currency: 'USD',
        avatarColor: 'from-slate-600 to-zinc-800',
      },
    ];

    const now = new Date().toISOString();
    initialAccounts.forEach((acc) => {
      this.accounts.set(acc.id, {
        ...acc,
        createdAt: now,
        updatedAt: now,
      });
    });

    // Seed an initial genesis ledger entry for treasury bootstrap
    const genesisTxId = 'tx_genesis_000';
    const genesisEntry: LedgerEntry = {
      id: 'led_genesis_000',
      transactionId: genesisTxId,
      accountId: 'acc_treasury',
      accountName: 'Reserve Central Treasury',
      type: 'CREDIT',
      amount: 1000000.00,
      currency: 'USD',
      balanceAfter: 1000000.00,
      hash: this.calculateHash('GENESIS', genesisTxId, 1000000.00, 'acc_treasury'),
      createdAt: now,
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
      let releaseThisLock: () => void = () => {};
      const currentLock = this.accountLocks.get(id) || Promise.resolve();

      let nextLockResolver: () => void;
      const nextLock = new Promise<void>((resolve) => {
        nextLockResolver = resolve;
      });

      // Chain the lock
      this.accountLocks.set(id, currentLock.then(() => nextLock));

      // Wait until previous lock for this row finishes
      await currentLock;

      releaseThisLock = () => {
        nextLockResolver!();
        if (this.accountLocks.get(id) === nextLock) {
          this.accountLocks.delete(id);
        }
      };

      releaseFns.push(releaseThisLock);
    }

    // Return composite unlock function
    return () => {
      // Release in reverse order of acquisition
      for (let i = releaseFns.length - 1; i >= 0; i--) {
        releaseFns[i]();
      }
    };
  }

  // --- CRYPTOGRAPHIC AUDIT HASH ---
  private calculateHash(prevHash: string, txId: string, amount: number, accountId: string): string {
    return crypto
      .createHash('sha256')
      .update(`${prevHash}:${txId}:${amount}:${accountId}:${Date.now()}`)
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
    bypassLocksForDemo?: boolean; // Used to demonstrate race conditions in stress tester
  }): Promise<{ transaction: Transaction; replayed: boolean }> {
    const startTime = performance.now();
    const {
      sourceAccountId,
      destinationAccountId,
      amount,
      idempotencyKey,
      description = 'Peer-to-Peer Transfer',
      simulatedLatencyMs = 0,
      bypassLocksForDemo = false,
    } = params;

    if (sourceAccountId === destinationAccountId) {
      throw new Error('Self-transfer is disallowed: source and destination must differ');
    }

    if (amount <= 0 || isNaN(amount)) {
      throw new Error('Transfer amount must be strictly positive');
    }

    // 1. Idempotency Check
    const existingKeyRecord = this.idempotencyStore.get(idempotencyKey);
    if (existingKeyRecord) {
      if (existingKeyRecord.status === 'IN_FLIGHT') {
        throw new Error('Concurrent operation in progress for this Idempotency-Key. Please retry.');
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

    // Mark idempotency key as IN_FLIGHT
    this.idempotencyStore.set(idempotencyKey, {
      key: idempotencyKey,
      status: 'IN_FLIGHT',
      createdAt: Date.now(),
    });

    let unlockRows = () => {};

    try {
      // 2. Lock rows in sorted order (unless intentionally bypassed for dirty-read demo)
      if (!bypassLocksForDemo) {
        unlockRows = await this.acquireRowLevelLocks(sourceAccountId, destinationAccountId);
      }

      // 3. Optional simulated network/processing latency
      if (simulatedLatencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, simulatedLatencyMs));
      }

      // 4. Validate accounts exist
      const source = this.accounts.get(sourceAccountId);
      const destination = this.accounts.get(destinationAccountId);

      if (!source) throw new Error(`Source account '${sourceAccountId}' not found`);
      if (!destination) throw new Error(`Destination account '${destinationAccountId}' not found`);

      // 5. ACID Balance Verification
      if (source.balance < amount) {
        throw new Error(
          `Insufficient funds in ${source.name}. Required: $${amount.toFixed(2)}, Available: $${source.balance.toFixed(2)}`
        );
      }

      // 6. Double-Entry Posting
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();

      // Deduct from Source
      source.balance = Number((source.balance - amount).toFixed(2));
      source.updatedAt = now;

      // Credit to Destination
      destination.balance = Number((destination.balance + amount).toFixed(2));
      destination.updatedAt = now;

      const prevHash = this.ledgerEntries.length > 0 
        ? this.ledgerEntries[this.ledgerEntries.length - 1].hash 
        : 'ROOT';

      // Entry 1: DEBIT source account
      const debitEntry: LedgerEntry = {
        id: `led_deb_${Math.random().toString(36).substring(2, 9)}`,
        transactionId: txId,
        accountId: source.id,
        accountName: source.name,
        type: 'DEBIT',
        amount: amount,
        currency: source.currency,
        balanceAfter: source.balance,
        hash: this.calculateHash(prevHash, txId, amount, source.id),
        createdAt: now,
      };

      // Entry 2: CREDIT destination account
      const creditEntry: LedgerEntry = {
        id: `led_crd_${Math.random().toString(36).substring(2, 9)}`,
        transactionId: txId,
        accountId: destination.id,
        accountName: destination.name,
        type: 'CREDIT',
        amount: amount,
        currency: destination.currency,
        balanceAfter: destination.balance,
        hash: this.calculateHash(debitEntry.hash, txId, amount, destination.id),
        createdAt: now,
      };

      this.ledgerEntries.unshift(creditEntry);
      this.ledgerEntries.unshift(debitEntry);

      // Keep only recent 200 entries for in-memory display
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
        amount,
        currency: source.currency,
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

      // 7. Save Idempotency state as COMPLETED
      this.idempotencyStore.set(idempotencyKey, {
        key: idempotencyKey,
        status: 'COMPLETED',
        responsePayload: transaction,
        createdAt: Date.now(),
      });

      return { transaction, replayed: false };
    } catch (err: any) {
      // Clear in-flight idempotency on fatal failure so client can retry with fresh state
      this.idempotencyStore.delete(idempotencyKey);
      throw err;
    } finally {
      // Always release row locks
      unlockRows();
    }
  }

  // --- MATHEMATICAL INVARIANT AUDIT ENGINE ---
  // In Double-Entry Bookkeeping: SUM(All Credits) must equal SUM(All Debits) + Genesis Credit
  public auditSystem(): InvariantAudit {
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of this.ledgerEntries) {
      if (entry.type === 'DEBIT') {
        totalDebits += entry.amount;
      } else if (entry.type === 'CREDIT' && entry.id !== 'led_genesis_000') {
        totalCredits += entry.amount;
      }
    }

    totalDebits = Number(totalDebits.toFixed(2));
    totalCredits = Number(totalCredits.toFixed(2));

    const delta = Number(Math.abs(totalCredits - totalDebits).toFixed(2));
    const isBalanced = delta === 0;

    return {
      totalDebits,
      totalCredits,
      isBalanced,
      delta,
      totalTransactions: this.transactions.length,
      totalLedgerEntries: this.ledgerEntries.length,
      systemIntegrityStatus: isBalanced ? 'VERIFIED' : 'COMPROMISED',
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
}

// Global singleton instance across Next.js API hot-reloads
const globalForLedger = globalThis as unknown as { ledgerEngine: LedgerEngine };
export const ledger = globalForLedger.ledgerEngine || new LedgerEngine();
if (process.env.NODE_ENV !== 'production') globalForLedger.ledgerEngine = ledger;
