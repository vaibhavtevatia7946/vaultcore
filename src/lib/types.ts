export type AccountType = 'USER' | 'MERCHANT' | 'TREASURY';

export interface Account {
  id: string;
  name: string;
  vpa: string; // UPI ID (e.g. aarav@oksbi)
  accountNumber: string;
  bankName: string;
  type: AccountType;
  balance: number; // in INR (₹) - available
  heldBalance?: number; // funds locked in Two-Phase Commit / Pre-Auth
  currency: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK' | 'HELD' | 'CAPTURED' | 'VOIDED';

export interface Transaction {
  id: string;
  idempotencyKey: string; // NPCI RRN / Client UUID
  sourceAccountId: string;
  destinationAccountId: string;
  sourceAccountName: string;
  destinationAccountName: string;
  sourceVpa: string;
  destinationVpa: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  lockAcquiredOrder: string[]; // Lexicographical ordering to eliminate deadlocks
  executionTimeMs: number;
  createdAt: string;
  replayedFromCache?: boolean;
}

export type EntryType = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  transactionId: string;
  accountId: string;
  accountName: string;
  vpa: string;
  type: EntryType;
  amount: number;
  currency: string;
  balanceAfter: number;
  prevHash: string; // Hash of the previous block in the chain
  hash: string; // SHA-256 Merkle chain hash
  createdAt: string;
  isTampered?: boolean;
}

export interface InvariantAudit {
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  delta: number;
  totalTransactions: number;
  totalLedgerEntries: number;
  systemIntegrityStatus: 'VERIFIED' | 'COMPROMISED';
  lastAuditTime: string;
  isChainValid: boolean;
  tamperedEntryId?: string | null;
  heldFunds?: number;
}

export interface IdempotencyRecord {
  key: string;
  status: 'IN_FLIGHT' | 'COMPLETED';
  responsePayload?: any;
  createdAt: number;
}

export interface TwoPhaseHold {
  id: string;
  idempotencyKey: string;
  sourceAccountId: string;
  sourceAccountName: string;
  sourceVpa: string;
  destinationAccountId: string;
  destinationAccountName: string;
  destinationVpa: string;
  amount: number;
  currency: string;
  description: string;
  status: 'HELD' | 'CAPTURED' | 'VOIDED';
  createdAt: string;
}

export interface ConcurrencySimulationResult {
  totalRequestsSent: number;
  successfulTransfers: number;
  rejectedTransfers: number;
  deadlocksAvoided: number;
  raceConditionDoubleSpendsDetected: number;
  totalExecutionTimeMs: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  tps: number;
  auditInvariantMaintained: boolean;
  logs: string[];
}
