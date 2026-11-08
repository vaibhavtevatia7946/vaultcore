import crypto from 'crypto';
import { Account, Transaction, LedgerEntry, InvariantAudit, IdempotencyRecord } from './types';

// In-Memory Production-Grade State Store (Simulates NPCI / CBS PostgreSQL with strict ACID transactions)
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
        id: 'acc_aarav',
        name: 'Aarav Sharma',
        vpa: 'aarav@oksbi',
        accountNumber: 'SBIN0004128-9842',
        bankName: 'State Bank of India',
        type: 'USER',
        balance: 75000.00,
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
        balance: 45000.00,
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
        balance: 20000.00,
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
        balance: 550000.00,
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
        balance: 10000000.00, // ₹1 Crore Pool
        currency: 'INR',
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

    // Seed genesis ledger entry for RBI settlement pool bootstrap
    const genesisTxId = 'tx_genesis_rbi_000';
    const genesisEntry: LedgerEntry = {
      id: 'led_genesis_000',
      transactionId: genesisTxId,
      accountId: 'acc_treasury',
      accountName: 'NPCI / RBI Settlement Guarantee Pool',
      vpa: 'npci.settle@rbi',
      type: 'CREDIT',
      amount: 10000000.00,
      currency: 'INR',
      balanceAfter: 10000000.00,
      hash: this.calculateHash('GENESIS_RBI', genesisTxId, 10000000.00, 'acc_treasury'),
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

      this.accountLocks.set(id, currentLock.then(() => nextLock));
      await currentLock;

      releaseThisLock = () => {
        nextLockResolver!();
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

      const prevHash = this.ledgerEntries.length > 0 
        ? this.ledgerEntries[this.ledgerEntries.length - 1].hash 
        : 'ROOT_RBI';

      // Entry 1: DEBIT source account
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
        hash: this.calculateHash(prevHash, txId, amount, source.id),
        createdAt: now,
      };

      // Entry 2: CREDIT destination account
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
        hash: this.calculateHash(debitEntry.hash, txId, amount, destination.id),
        createdAt: now,
      };

      this.ledgerEntries.unshift(creditEntry);
      this.ledgerEntries.unshift(debitEntry);

      if (this.ledgerEntries.length > 250) {
        this.ledgerEntries = this.ledgerEntries.slice(0, 250);
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

  // --- MATHEMATICAL INVARIANT AUDIT ENGINE ---
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

const globalForLedger = globalThis as unknown as { ledgerEngine: LedgerEngine };
export const ledger = globalForLedger.ledgerEngine || new LedgerEngine();
if (process.env.NODE_ENV !== 'production') globalForLedger.ledgerEngine = ledger;
